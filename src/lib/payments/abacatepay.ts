import crypto from "node:crypto";
import {
  type CreatePixInput,
  type CreatePixOutput,
  GatewayNotConfiguredError,
  GatewayWebhookError,
  type PaymentGateway,
  type PaymentStatus,
  type WebhookVerifyInput,
  type WebhookVerifyOutput,
} from "./types";

export function mapAbacateStatus(s: string): PaymentStatus {
  switch (s.toUpperCase()) {
    case "PAID":
      return "approved";
    case "PENDING":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "CANCELLED":
    case "REFUNDED":
      return "rejected";
    default:
      return "pending";
  }
}

function stripCpfDigits(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function pickHeader(
  headers: Record<string, string | string[] | undefined>,
  names: string[],
): string | null {
  const lowercased: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(headers)) lowercased[k.toLowerCase()] = v;
  for (const name of names) {
    const v = lowercased[name.toLowerCase()];
    if (typeof v === "string" && v.length > 0) return v;
    if (Array.isArray(v) && v.length > 0) return v[0];
  }
  return null;
}

export class AbacatePayGateway implements PaymentGateway {
  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
    private readonly webhookSecret: string,
  ) {}

  async createPix(input: CreatePixInput): Promise<CreatePixOutput> {
    const body = {
      method: "PIX",
      data: {
        amount: input.amountCents,
        expiresIn: input.expiresInSeconds,
        description: input.description,
        externalId: input.externalId,
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          taxId: stripCpfDigits(input.customer.cpf),
          cellphone: input.customer.phone ?? "",
        },
        metadata: {},
      },
    };

    const res = await fetch(`${this.apiUrl}/transparents/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`AbacatePay HTTP ${res.status}: ${text}`);
    }
    let parsed: { success?: boolean; data?: AbacatePixResponse; error?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`AbacatePay createPix: resposta não-JSON (${text.slice(0, 200)})`);
    }
    if (!parsed.success || !parsed.data) {
      throw new Error(`AbacatePay createPix: ${JSON.stringify(parsed)}`);
    }

    return {
      gatewayPaymentId: parsed.data.id,
      qrCode: parsed.data.brCode,
      qrCodeBase64: parsed.data.brCodeBase64,
      expiresAt: new Date(parsed.data.expiresAt),
    };
  }

  async getStatus(gatewayPaymentId: string): Promise<PaymentStatus> {
    const url = `${this.apiUrl}/transparents/check?id=${encodeURIComponent(gatewayPaymentId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`AbacatePay HTTP ${res.status}: ${text}`);
    }
    let parsed: { success?: boolean; data?: { id: string; status: string }; error?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`AbacatePay getStatus: resposta não-JSON (${text.slice(0, 200)})`);
    }
    if (!parsed.success || !parsed.data) {
      throw new Error(`AbacatePay getStatus: ${JSON.stringify(parsed)}`);
    }
    return mapAbacateStatus(parsed.data.status);
  }

  verifyWebhook(input: WebhookVerifyInput): WebhookVerifyOutput {
    if (!this.webhookSecret) {
      throw new GatewayNotConfiguredError("Webhook secret não configurado");
    }
    const received = pickHeader(input.headers, ["webhook-signature", "x-abacate-signature"]);
    if (!received) {
      throw new GatewayWebhookError("Header de assinatura ausente");
    }

    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(input.rawBody)
      .digest("hex");

    let receivedBuf: Buffer;
    let expectedBuf: Buffer;
    try {
      receivedBuf = Buffer.from(received, "hex");
      expectedBuf = Buffer.from(expected, "hex");
    } catch {
      throw new GatewayWebhookError("Assinatura inválida");
    }
    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      throw new GatewayWebhookError("Assinatura inválida");
    }

    let payload: { event?: string; data?: { id?: string; status?: string } };
    try {
      payload = JSON.parse(input.rawBody);
    } catch {
      throw new GatewayWebhookError("Body inválido");
    }
    const id = payload?.data?.id;
    if (!id) throw new GatewayWebhookError("Payload sem id");

    let status: PaymentStatus;
    if (payload.event === "transparent.completed") {
      status = "approved";
    } else if (
      payload.event === "transparent.refunded" ||
      payload.event === "transparent.disputed" ||
      payload.event === "transparent.lost"
    ) {
      status = "rejected";
    } else {
      status = mapAbacateStatus(payload.data?.status ?? "");
    }

    return { gatewayPaymentId: id, status };
  }
}

type AbacatePixResponse = {
  id: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
};
