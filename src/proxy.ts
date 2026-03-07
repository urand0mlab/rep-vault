import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
const { auth } = NextAuth(authConfig);

const CANONICAL_HOST = (process.env.APP_CANONICAL_HOST ?? "rep-vault.com").trim().toLowerCase();
const ADDITIONAL_ALLOWED_HOSTS = new Set(
    (process.env.APP_ALLOWED_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean)
);

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHost(rawHost: string): string {
    return rawHost.trim().toLowerCase().split(":")[0] ?? "";
}

function getRequestHost(req: NextRequest): string {
    const headerHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return normalizeHost(headerHost ?? req.nextUrl.host);
}

function buildCanonicalUrl(req: NextRequest): URL {
    const redirected = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${CANONICAL_HOST}`);
    return redirected;
}

export function applyHostPolicy(req: NextRequest): NextResponse | undefined {
    const host = getRequestHost(req);
    if (!host) return undefined;

    if (LOCAL_DEV_HOSTS.has(host)) {
        return undefined;
    }

    if (host === CANONICAL_HOST) {
        return undefined;
    }

    if (host === `www.${CANONICAL_HOST}`) {
        return NextResponse.redirect(buildCanonicalUrl(req), 308);
    }

    if (host.endsWith(".vercel.app")) {
        return NextResponse.redirect(buildCanonicalUrl(req), 308);
    }

    if (ADDITIONAL_ALLOWED_HOSTS.has(host)) {
        return undefined;
    }

    return NextResponse.redirect(buildCanonicalUrl(req), 308);
}

export default auth((req) => {
    const hostPolicyResponse = applyHostPolicy(req);
    if (hostPolicyResponse) {
        return hostPolicyResponse;
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
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
