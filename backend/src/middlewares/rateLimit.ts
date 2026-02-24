import { TRPCError } from '@trpc/server';

const memoryStore = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL_MS = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore) {
    if (now > record.resetAt) memoryStore.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded, try again later',
    });
  }

  record.count += 1;
}
