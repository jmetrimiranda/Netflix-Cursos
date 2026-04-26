import { getClientIp, rateLimit, rateLimitResponse, resetRateLimits } from "@/lib/rate-limit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());
  afterEach(() => resetRateLimits());

  it("aceita até `max` requests dentro da janela", () => {
    for (let i = 0; i < 3; i++) {
      const r = rateLimit("foo", { max: 3, windowMs: 60_000 });
      expect(r.ok).toBe(true);
    }
  });

  it("retorna 429-equivalent quando excede max", () => {
    for (let i = 0; i < 3; i++) rateLimit("bar", { max: 3, windowMs: 60_000 });
    const r = rateLimit("bar", { max: 3, windowMs: 60_000 });
    expect(r.ok).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
    expect(r.remaining).toBe(0);
  });

  it("reseta após a janela passar", async () => {
    rateLimit("baz", { max: 1, windowMs: 30 });
    expect(rateLimit("baz", { max: 1, windowMs: 30 }).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(rateLimit("baz", { max: 1, windowMs: 30 }).ok).toBe(true);
  });

  it("isola buckets por chave diferentes", () => {
    rateLimit("k1", { max: 1, windowMs: 60_000 });
    expect(rateLimit("k1", { max: 1, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit("k2", { max: 1, windowMs: 60_000 }).ok).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extrai do x-forwarded-for o primeiro IP", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("usa x-real-ip quando não tem x-forwarded-for", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("retorna 'unknown' sem headers", () => {
    const req = new Request("http://x");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimitResponse", () => {
  beforeEach(() => resetRateLimits());

  it("retorna null quando dentro do limite", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1" } });
    expect(rateLimitResponse(req, "test", { max: 3, windowMs: 60_000 })).toBeNull();
  });

  it("retorna 429 com header Retry-After quando excede", async () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2" } });
    rateLimitResponse(req, "test", { max: 1, windowMs: 60_000 });
    const res = rateLimitResponse(req, "test", { max: 1, windowMs: 60_000 });
    if (!res) throw new Error("expected rate-limit response");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Muitas requisi/);
  });

  it("limita por IP independentemente — IPs diferentes têm buckets distintos", () => {
    const reqA = new Request("http://x", { headers: { "x-forwarded-for": "3.3.3.3" } });
    const reqB = new Request("http://x", { headers: { "x-forwarded-for": "4.4.4.4" } });
    rateLimitResponse(reqA, "test", { max: 1, windowMs: 60_000 });
    expect(rateLimitResponse(reqA, "test", { max: 1, windowMs: 60_000 })).not.toBeNull();
    expect(rateLimitResponse(reqB, "test", { max: 1, windowMs: 60_000 })).toBeNull();
  });
});
