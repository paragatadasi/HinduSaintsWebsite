import { createHmac } from "node:crypto";

const feedbackRateLimit = 5;
const feedbackRateLimitWindowMs = 10 * 60 * 1000;
const cleanupIntervalMs = 60 * 1000;

type RateLimitEntry = {
  attempts: number[];
};

export type SlidingWindowRateLimiter = {
  consume: (key: string, now?: number) => boolean;
  prune: (now?: number) => void;
  size: () => number;
};

const globalForFeedbackRateLimit = globalThis as unknown as {
  feedbackRateLimitCleanupTimer?: ReturnType<typeof setInterval>;
  feedbackRateLimiter?: SlidingWindowRateLimiter;
};

export function isFeedbackRateLimited(requestHeaders: Headers) {
  const secret = process.env.FEEDBACK_RATE_LIMIT_SECRET ?? process.env.AUTH_SECRET;
  const fingerprint = getFeedbackRateLimitFingerprint(requestHeaders, secret);
  if (!fingerprint) return false;

  const limiter = getFeedbackRateLimiter();
  ensureCleanupTimer(limiter);
  return !limiter.consume(fingerprint);
}

export function getFeedbackRateLimitFingerprint(requestHeaders: Headers, secret?: string) {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor ?? requestHeaders.get("x-real-ip")?.trim();
  if (!secret || !clientIp) return undefined;

  return createHmac("sha256", secret).update(clientIp).digest("hex");
}

export function createSlidingWindowRateLimiter({
  limit = feedbackRateLimit,
  windowMs = feedbackRateLimitWindowMs
}: {
  limit?: number;
  windowMs?: number;
} = {}): SlidingWindowRateLimiter {
  const entries = new Map<string, RateLimitEntry>();

  function prune(now = Date.now()) {
    const cutoff = now - windowMs;

    for (const [key, entry] of entries) {
      const attempts = entry.attempts.filter((attemptedAt) => attemptedAt > cutoff);
      if (attempts.length === 0) {
        entries.delete(key);
      } else {
        entry.attempts = attempts;
      }
    }
  }

  function consume(key: string, now = Date.now()) {
    const cutoff = now - windowMs;
    const entry = entries.get(key) ?? { attempts: [] };
    entry.attempts = entry.attempts.filter((attemptedAt) => attemptedAt > cutoff);

    if (entry.attempts.length >= limit) {
      entries.set(key, entry);
      return false;
    }

    entry.attempts.push(now);
    entries.set(key, entry);
    return true;
  }

  return {
    consume,
    prune,
    size: () => entries.size
  };
}

function getFeedbackRateLimiter() {
  globalForFeedbackRateLimit.feedbackRateLimiter ??= createSlidingWindowRateLimiter();
  return globalForFeedbackRateLimit.feedbackRateLimiter;
}

function ensureCleanupTimer(limiter: SlidingWindowRateLimiter) {
  if (globalForFeedbackRateLimit.feedbackRateLimitCleanupTimer) return;

  const timer = setInterval(() => limiter.prune(), cleanupIntervalMs);
  timer.unref?.();
  globalForFeedbackRateLimit.feedbackRateLimitCleanupTimer = timer;
}
