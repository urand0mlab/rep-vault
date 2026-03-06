type RateLimitOptions = {
    maxRequests: number;
    windowMs: number;
};

export type RateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
};

type CounterEntry = {
    count: number;
    resetAt: number;
};

export class InMemoryRateLimiter {
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private readonly counters = new Map<string, CounterEntry>();

    constructor(options: RateLimitOptions) {
        this.maxRequests = options.maxRequests;
        this.windowMs = options.windowMs;
    }

    check(key: string, now = Date.now()): RateLimitResult {
        this.cleanupExpired(now);

        const existing = this.counters.get(key);
        if (!existing || existing.resetAt <= now) {
            const resetAt = now + this.windowMs;
            this.counters.set(key, { count: 1, resetAt });
            return {
                allowed: true,
                limit: this.maxRequests,
                remaining: Math.max(this.maxRequests - 1, 0),
                resetAt,
                retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 1),
            };
        }

        existing.count += 1;
        const allowed = existing.count <= this.maxRequests;
        return {
            allowed,
            limit: this.maxRequests,
            remaining: Math.max(this.maxRequests - existing.count, 0),
            resetAt: existing.resetAt,
            retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
        };
    }

    reset(key: string): void {
        this.counters.delete(key);
    }

    clear(): void {
        this.counters.clear();
    }

    private cleanupExpired(now: number): void {
        for (const [key, entry] of this.counters.entries()) {
            if (entry.resetAt <= now) {
                this.counters.delete(key);
            }
        }
    }
}
