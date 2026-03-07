import { handlers } from "@/auth";
import { InMemoryRateLimiter } from "@/lib/rate-limit";

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

function getClientIp(req: Request): string {
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

export function resetAuthRouteRateLimitersForTest(): void {
    authIpLimiter.clear();
    authIpRouteLimiter.clear();
}

export function applyAuthRouteRateLimit(req: Request): Response | undefined {
    if (req.method !== "POST") {
        return undefined;
    }

    const ip = getClientIp(req);
    const pathname = new URL(req.url).pathname;
    const perIpResult = authIpLimiter.check(ip);
    const perIpRouteResult = authIpRouteLimiter.check(`${ip}:${pathname}`);

    if (perIpResult.allowed && perIpRouteResult.allowed) {
        return undefined;
    }

    const retryAfterSeconds = Math.max(perIpResult.retryAfterSeconds, perIpRouteResult.retryAfterSeconds);
    return Response.json(
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

export const GET = handlers.GET;

export async function POST(...args: Parameters<typeof handlers.POST>) {
    const [req] = args;
    const rateLimitedResponse = applyAuthRouteRateLimit(req);
    if (rateLimitedResponse) {
        return rateLimitedResponse;
    }

    return handlers.POST(...args);
}
