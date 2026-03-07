/** @jest-environment node */
import type { NextRequest } from "next/server";

jest.mock("@/auth", () => ({
    handlers: {
        GET: jest.fn(),
        POST: jest.fn(async () => new Response("ok", { status: 200 })),
    },
}));

const { handlers } = require("@/auth") as { handlers: { POST: jest.Mock } };
const { applyAuthRouteRateLimit, resetAuthRouteRateLimitersForTest, POST } =
    require("./route") as typeof import("./route");

function createRequest(method = "POST", ip = "127.0.0.1"): NextRequest {
    return new Request("https://rep-vault.com/api/auth/callback/passkey", {
        method,
        headers: {
            "x-forwarded-for": ip,
        },
    }) as unknown as NextRequest;
}

describe("auth route rate limiting", () => {
    beforeEach(() => {
        resetAuthRouteRateLimitersForTest();
        handlers.POST.mockClear();
    });

    it("blocks after too many POST attempts", async () => {
        const req = createRequest();

        for (let i = 0; i < 10; i++) {
            expect(applyAuthRouteRateLimit(req)).toBeUndefined();
        }

        const blockedResponse = applyAuthRouteRateLimit(req);
        expect(blockedResponse?.status).toBe(429);
        await expect(blockedResponse?.json()).resolves.toMatchObject({
            error: expect.stringContaining("Too many authentication attempts"),
        });
    });

    it("does not rate limit non-POST requests", () => {
        const req = createRequest("GET");
        expect(applyAuthRouteRateLimit(req)).toBeUndefined();
    });
});

describe("auth route POST handler", () => {
    beforeEach(() => {
        resetAuthRouteRateLimitersForTest();
        handlers.POST.mockClear();
    });

    it("delegates to NextAuth handler when under limits", async () => {
        const response = await POST(createRequest());
        expect(response.status).toBe(200);
        expect(handlers.POST).toHaveBeenCalledTimes(1);
    });

    it("returns 429 and skips NextAuth handler when over limit", async () => {
        const req = createRequest();
        for (let i = 0; i < 10; i++) {
            await POST(req);
        }

        const blockedResponse = await POST(req);
        expect(blockedResponse.status).toBe(429);
        expect(handlers.POST).toHaveBeenCalledTimes(10);
    });
});
