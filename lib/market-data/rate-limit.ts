interface Bucket { tokens: number; lastRefill: number }
const buckets = new Map<string, Bucket>();

export function takeRateLimitToken(key: string, capacity = 30, refillPerMinute = 30) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: capacity, lastRefill: now };
  bucket.tokens = Math.min(capacity, bucket.tokens + ((now - bucket.lastRefill) / 60_000) * refillPerMinute);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) { buckets.set(key, bucket); return false; }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
