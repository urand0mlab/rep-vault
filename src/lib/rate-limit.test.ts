import { InMemoryRateLimiter } from "./rate-limit";

describe("InMemoryRateLimiter", () => {
    it("allows requests up to the configured limit", () => {
        const limiter = new InMemoryRateLimiter({ maxRequests: 2, windowMs: 1000 });

        expect(limiter.check("ip:1", 1000).allowed).toBe(true);
        expect(limiter.check("ip:1", 1001).allowed).toBe(true);
        expect(limiter.check("ip:1", 1002).allowed).toBe(false);
    });

    it("resets counters after the window expires", () => {
        const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 1000 });

        expect(limiter.check("ip:2", 1000).allowed).toBe(true);
        expect(limiter.check("ip:2", 1001).allowed).toBe(false);
        expect(limiter.check("ip:2", 2001).allowed).toBe(true);
    });
});
