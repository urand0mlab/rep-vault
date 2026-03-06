/** @jest-environment node */

import type { NextRequest } from "next/server";

jest.mock("next-auth", () => ({
    __esModule: true,
    default: () => ({
        auth: (handler: unknown) => handler,
    }),
}));

jest.mock("@/auth.config", () => ({
    __esModule: true,
    default: {},
}));

const { applyAuthRateLimit, resetAuthRateLimitersForTest } = require("./proxy") as typeof import("./proxy");

function createRequest(pathname: string, method = "POST", ip = "127.0.0.1"): NextRequest {
    return {
        method,
        headers: {
            get: (name: string) => {
                const lower = name.toLowerCase();
                if (lower === "x-forwarded-for") return ip;
                return null;
            },
        } as Headers,
        nextUrl: {
            pathname,
        },
    } as unknown as NextRequest;
}

describe("proxy auth rate limiting", () => {
    beforeEach(() => {
        resetAuthRateLimitersForTest();
    });

    it("returns 429 after too many POST attempts to auth API", async () => {
        const req = createRequest("/api/auth/callback/passkey");

        for (let i = 0; i < 10; i++) {
            expect(applyAuthRateLimit(req)).toBeUndefined();
        }

        const blockedResponse = applyAuthRateLimit(req);
        expect(blockedResponse?.status).toBe(429);
        await expect(blockedResponse?.json()).resolves.toMatchObject({
            error: expect.stringContaining("Too many authentication attempts"),
        });
    });

    it("does not rate limit non-auth paths", () => {
        const req = createRequest("/progress");
        expect(applyAuthRateLimit(req)).toBeUndefined();
    });
});
