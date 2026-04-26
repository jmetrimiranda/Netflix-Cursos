/**
 * In-memory rate limiter (ADR-014).
 *
 * Token bucket por chave (`<route>:<ip>`), `Map<string, { count, resetAt }>`.
 * Sem dependência externa, sem estado persistido. Em escala multi-instância
 * (não é o caso da Ativa hoje), trocar pra Upstash mantendo a mesma interface.
 *
 * Cada call a `rateLimit(key, ...)` retorna `{ ok, retryAfterSeconds }`.
 * Use `rateLimitResponse(...)` quando estiver dentro de um Route Handler.
 */
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function maybeSweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the bucket resets — 0 when ok. */
  retryAfterSeconds: number;
  /** Remaining requests in the current window after this call. */
  remaining: number;
};

export type RateLimitOptions = {
  /** Max requests allowed per window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
};

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSeconds: 0, remaining: opts.max - 1 };
  }

  if (existing.count >= opts.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0, remaining: opts.max - existing.count };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}

/**
 * Convenience wrapper that returns a 429 NextResponse when limited, or null when ok.
 * Sets `Retry-After` header in seconds.
 */
export function rateLimitResponse(
  request: Request,
  routeKey: string,
  opts: RateLimitOptions,
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${routeKey}:${ip}`, opts);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Muitas requisições. Tente novamente em alguns instantes." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

/**
 * Reset all buckets — used by tests.
 */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweep = Date.now();
}
