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

const { applyAuthRateLimit, applyHostPolicy, resetAuthRateLimitersForTest } = require("./proxy") as typeof import("./proxy");

function createRequest(pathname: string, method = "POST", ip = "127.0.0.1", host = "rep-vault.com"): NextRequest {
    return {
        method,
        headers: {
            get: (name: string) => {
                const lower = name.toLowerCase();
                if (lower === "x-forwarded-for") return ip;
                if (lower === "host") return host;
                return null;
            },
        } as Headers,
        nextUrl: {
            pathname,
            search: "",
            host,
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

describe("proxy host policy", () => {
    it("redirects vercel app host to canonical domain", () => {
        const req = createRequest("/login", "GET", "127.0.0.1", "rep-vault-nu.vercel.app");
        const response = applyHostPolicy(req);
        expect(response?.status).toBe(308);
        expect(response?.headers.get("location")).toBe("https://rep-vault.com/login");
    });

    it("redirects www host to canonical apex domain", () => {
        const req = createRequest("/progress", "GET", "127.0.0.1", "www.rep-vault.com");
        const response = applyHostPolicy(req);
        expect(response?.status).toBe(308);
        expect(response?.headers.get("location")).toBe("https://rep-vault.com/progress");
    });

    it("allows canonical host", () => {
        const req = createRequest("/history", "GET", "127.0.0.1", "rep-vault.com");
        expect(applyHostPolicy(req)).toBeUndefined();
    });
});
