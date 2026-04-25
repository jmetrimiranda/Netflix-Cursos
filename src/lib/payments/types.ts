export type PaymentStatus = "pending" | "approved" | "rejected" | "expired";

export type CreatePixInput = {
  amountCents: number;
  description: string;
  expiresInSeconds: number;
  externalId: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone?: string;
  };
};

export type CreatePixOutput = {
  gatewayPaymentId: string;
  qrCode: string;
  /** Base64 string with `data:image/png;base64,` prefix already included (AbacatePay returns it that way). Use directly in `<img src={...} />`. */
  qrCodeBase64: string;
  expiresAt: Date;
};

export type WebhookVerifyInput = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
};

export type WebhookVerifyOutput = {
  gatewayPaymentId: string;
  status: PaymentStatus;
};

export interface PaymentGateway {
  createPix(input: CreatePixInput): Promise<CreatePixOutput>;
  getStatus(gatewayPaymentId: string): Promise<PaymentStatus>;
  verifyWebhook(input: WebhookVerifyInput): WebhookVerifyOutput;
}

export class GatewayNotConfiguredError extends Error {
  constructor(message = "Gateway de pagamento não configurado.") {
    super(message);
    this.name = "GatewayNotConfiguredError";
  }
}

export class GatewayWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GatewayWebhookError";
  }
}
