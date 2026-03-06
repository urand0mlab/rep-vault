import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
const { auth } = NextAuth(authConfig);

const AUTH_IP_LIMIT = Number.parseInt(process.env.AUTH_RATE_LIMIT_IP_MAX ?? "20", 10);
const AUTH_IP_WINDOW_MS = Number.parseInt(process.env.AUTH_RATE_LIMIT_IP_WINDOW_MS ?? "60000", 10);
const AUTH_IP_ROUTE_LIMIT = Number.parseInt(process.env.AUTH_RATE_LIMIT_IP_ROUTE_MAX ?? "10", 10);
const AUTH_IP_ROUTE_WINDOW_MS = Number.parseInt(process.env.AUTH_RATE_LIMIT_IP_ROUTE_WINDOW_MS ?? "60000", 10);

const authIpLimiter = new InMemoryRateLimiter({
    maxRequests: Number.isFinite(AUTH_IP_LIMIT) && AUTH_IP_LIMIT > 0 ? AUTH_IP_LIMIT : 20,
    windowMs: Number.isFinite(AUTH_IP_WINDOW_MS) && AUTH_IP_WINDOW_MS > 0 ? AUTH_IP_WINDOW_MS : 60000,
});

const authIpRouteLimiter = new InMemoryRateLimiter({
    maxRequests: Number.isFinite(AUTH_IP_ROUTE_LIMIT) && AUTH_IP_ROUTE_LIMIT > 0 ? AUTH_IP_ROUTE_LIMIT : 10,
    windowMs: Number.isFinite(AUTH_IP_ROUTE_WINDOW_MS) && AUTH_IP_ROUTE_WINDOW_MS > 0 ? AUTH_IP_ROUTE_WINDOW_MS : 60000,
});

export function resetAuthRateLimitersForTest(): void {
    authIpLimiter.clear();
    authIpRouteLimiter.clear();
}

export function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() ?? "unknown";
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    return "unknown";
}

export function applyAuthRateLimit(req: NextRequest): NextResponse | undefined {
    const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth/");
    if (!isAuthApi || req.method !== "POST") {
        return undefined;
    }

    const ip = getClientIp(req);
    const perIpResult = authIpLimiter.check(ip);
    const perIpRouteResult = authIpRouteLimiter.check(`${ip}:${req.nextUrl.pathname}`);

    if (perIpResult.allowed && perIpRouteResult.allowed) {
        return undefined;
    }

    const retryAfterSeconds = Math.max(perIpResult.retryAfterSeconds, perIpRouteResult.retryAfterSeconds);
    return NextResponse.json(
        { error: "Too many authentication attempts. Please try again shortly." },
        {
            status: 429,
            headers: {
                "content-type": "application/json",
                "retry-after": String(retryAfterSeconds),
                "x-ratelimit-limit": String(Math.min(perIpResult.limit, perIpRouteResult.limit)),
                "x-ratelimit-remaining": String(Math.min(perIpResult.remaining, perIpRouteResult.remaining)),
                "x-ratelimit-reset": String(Math.max(perIpResult.resetAt, perIpRouteResult.resetAt)),
            },
        }
    );
}

export default auth((req) => {
    const rateLimitedResponse = applyAuthRateLimit(req);
    if (rateLimitedResponse) {
        return rateLimitedResponse;
    }

    const isLoggedIn = !!req.auth;
    const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth/");
    const isLoginPage = req.nextUrl.pathname === "/login";
    const isOnboardingPage = req.nextUrl.pathname === "/onboarding";

    // Let Auth.js API handlers run without app-level auth redirects.
    if (isAuthApi) {
        return;
    }

    // 1. Unauthenticated users get sent to Login
    if (!isLoggedIn && !isLoginPage) {
        const newUrl = new URL("/login", req.nextUrl.origin);
        return Response.redirect(newUrl);
    }

    // 2. Authenticated users who haven't finished onboarding MUST go to Onboarding
    if (isLoggedIn) {
        const hasFinishedOnboarding = req.auth?.user?.onboardingCompleted;

        if (!hasFinishedOnboarding && !isOnboardingPage && !isLoginPage) {
            return Response.redirect(new URL("/onboarding", req.nextUrl.origin));
        }

        // 3. Authenticated users who finished onboarding shouldn't see onboarding again
        if (hasFinishedOnboarding && (isOnboardingPage || isLoginPage)) {
            return Response.redirect(new URL("/", req.nextUrl.origin));
        }
    }
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
