// Simple in-memory rate limiter
const requestCounts: Record<string, { count: number; resetAt: number }> = {};

const MAX_REQUESTS = 100;
const WINDOW_MS = 60000;

export function rateLimiter(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts[ip];

  if (!entry || now > entry.resetAt) {
    requestCounts[ip] = { count: 1, resetAt: now + WINDOW_MS };
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  // 并发不安全：多个请求同时递增
  entry.count += 1;
  return true;
}

// 内存泄漏：永不过期，也没有清理机制
export function getRateLimitStats(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const ip of Object.keys(requestCounts)) {
    result[ip] = requestCounts[ip].count;
  }
  return result;
}
