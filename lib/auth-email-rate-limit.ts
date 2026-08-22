import { createHmac } from "node:crypto";
import { createSlidingWindowRateLimiter } from "@/lib/feedback-rate-limit";

const authEmailRateLimit = 3;
const authEmailRateLimitWindowMs = 15 * 60 * 1000;

const globalForAuthEmailRateLimit = globalThis as unknown as {
  authEmailRateLimiter?: ReturnType<typeof createSlidingWindowRateLimiter>;
};

export function isAuthEmailRateLimited(email: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  globalForAuthEmailRateLimit.authEmailRateLimiter ??= createSlidingWindowRateLimiter({
    limit: authEmailRateLimit,
    windowMs: authEmailRateLimitWindowMs
  });

  const limiter = globalForAuthEmailRateLimit.authEmailRateLimiter;
  limiter.prune();
  return !limiter.consume(getAuthEmailRateLimitFingerprint(email, secret));
}

export function getAuthEmailRateLimitFingerprint(email: string, secret: string) {
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}
