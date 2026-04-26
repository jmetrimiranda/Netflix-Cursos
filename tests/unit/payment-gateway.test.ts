import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GatewayNotConfiguredError,
  GatewayWebhookError,
  getPaymentGateway,
} from "../../src/lib/payments";
import { AbacatePayGateway, mapAbacateStatus } from "../../src/lib/payments/abacatepay";

const ENV_KEYS = [
  "PAYMENT_PROVIDER",
  "ABACATEPAY_API_KEY",
  "ABACATEPAY_WEBHOOK_SECRET",
  "ABACATEPAY_API_URL",
];

describe("getPaymentGateway", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) vi.stubEnv(k, "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lança GatewayNotConfiguredError se ABACATEPAY_API_KEY vazia", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "abacatepay");
    expect(() => getPaymentGateway()).toThrow(GatewayNotConfiguredError);
  });

  it("retorna gateway mesmo se webhook secret vazio", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "abacatepay");
    vi.stubEnv("ABACATEPAY_API_KEY", "abc_dev_test");
    vi.stubEnv("ABACATEPAY_WEBHOOK_SECRET", "");
    const gateway = getPaymentGateway();
    expect(gateway).toBeInstanceOf(AbacatePayGateway);
  });

  it("lança erro se PAYMENT_PROVIDER for desconhecido", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "stripe");
    expect(() => getPaymentGateway()).toThrow(/PAYMENT_PROVIDER desconhecido/);
  });
});

describe("mapAbacateStatus", () => {
  it.each([
    ["PAID", "approved"],
    ["PENDING", "pending"],
    ["EXPIRED", "expired"],
    ["CANCELLED", "rejected"],
    ["REFUNDED", "rejected"],
    ["", "pending"],
    ["UNKNOWN", "pending"],
  ])("mapeia %s → %s", (input, expected) => {
    expect(mapAbacateStatus(input)).toBe(expected);
  });
});

describe("AbacatePayGateway.verifyWebhook", () => {
  const SECRET = "wh_sec_test";
  const URL = "https://api.abacatepay.com/v2";

  function sign(body: string, secret = SECRET): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  it("lança GatewayNotConfiguredError se webhookSecret vazio", () => {
    const gw = new AbacatePayGateway("k", URL, "");
    expect(() =>
      gw.verifyWebhook({ headers: { "webhook-signature": "abc" }, rawBody: "{}" }),
    ).toThrow(GatewayNotConfiguredError);
  });

  it("lança GatewayWebhookError se header de assinatura ausente", () => {
    const gw = new AbacatePayGateway("k", URL, SECRET);
    expect(() => gw.verifyWebhook({ headers: {}, rawBody: "{}" })).toThrow(GatewayWebhookError);
  });

  it("aceita HMAC válido em header webhook-signature", () => {
    const body = JSON.stringify({
      event: "transparent.completed",
      data: { id: "pix_char_aaa", status: "PAID" },
    });
    const gw = new AbacatePayGateway("k", URL, SECRET);
    const out = gw.verifyWebhook({
      headers: { "webhook-signature": sign(body) },
      rawBody: body,
    });
    expect(out).toEqual({ gatewayPaymentId: "pix_char_aaa", status: "approved" });
  });

  it("aceita HMAC válido em header x-abacate-signature (fallback)", () => {
    const body = JSON.stringify({ data: { id: "pix_char_bbb", status: "PENDING" } });
    const gw = new AbacatePayGateway("k", URL, SECRET);
    const out = gw.verifyWebhook({
      headers: { "x-abacate-signature": sign(body) },
      rawBody: body,
    });
    expect(out).toEqual({ gatewayPaymentId: "pix_char_bbb", status: "pending" });
  });

  it("rejeita HMAC inválido", () => {
    const body = JSON.stringify({ data: { id: "x", status: "PAID" } });
    const gw = new AbacatePayGateway("k", URL, SECRET);
    expect(() =>
      gw.verifyWebhook({ headers: { "webhook-signature": sign(body, "outro") }, rawBody: body }),
    ).toThrow(GatewayWebhookError);
  });

  it("mapeia evento de refund para rejected", () => {
    const body = JSON.stringify({
      event: "transparent.refunded",
      data: { id: "pix_char_zzz", status: "REFUNDED" },
    });
    const gw = new AbacatePayGateway("k", URL, SECRET);
    const out = gw.verifyWebhook({
      headers: { "webhook-signature": sign(body) },
      rawBody: body,
    });
    expect(out.status).toBe("rejected");
  });
});

describe("AbacatePayGateway.createPix", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia body em formato { method: 'PIX', data: { ... } } com taxId stripado de máscara", async () => {
    const captured: { url: string; body: string }[] = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      captured.push({ url, body: init.body as string });
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "pix_char_xxx",
            brCode: "0002012...",
            brCodeBase64: "data:image/png;base64,AAA",
            expiresAt: "2026-12-31T23:59:59.000Z",
            status: "PENDING",
            devMode: true,
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const gw = new AbacatePayGateway("abc_dev_test", "https://api.abacatepay.com/v2", "");
    const out = await gw.createPix({
      amountCents: 9900,
      description: "Curso X",
      expiresInSeconds: 1800,
      externalId: "pay_local_1",
      customer: {
        name: "Fulano",
        email: "f@example.com",
        cpf: "123.456.789-09",
      },
    });

    expect(captured.length).toBe(1);
    const call = captured[0];
    expect(call.url).toBe("https://api.abacatepay.com/v2/transparents/create");
    const parsed = JSON.parse(call.body);
    expect(parsed.method).toBe("PIX");
    expect(parsed.data.amount).toBe(9900);
    expect(parsed.data.expiresIn).toBe(1800);
    expect(parsed.data.externalId).toBe("pay_local_1");
    expect(parsed.data.customer.taxId).toBe("12345678909");
    expect(parsed.data.customer.cellphone).toBe("");
    expect(parsed.data.metadata).toEqual({});

    expect(out.gatewayPaymentId).toBe("pix_char_xxx");
    expect(out.qrCodeBase64.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("propaga erro com status HTTP em falha de rede", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 })),
    );
    const gw = new AbacatePayGateway("k", "https://api.abacatepay.com/v2", "");
    await expect(
      gw.createPix({
        amountCents: 100,
        description: "x",
        expiresInSeconds: 60,
        externalId: "id",
        customer: { name: "n", email: "e@e.com", cpf: "11111111111" },
      }),
    ).rejects.toThrow(/AbacatePay HTTP 500/);
  });
});
