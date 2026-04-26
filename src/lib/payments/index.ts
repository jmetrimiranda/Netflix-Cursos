import { AbacatePayGateway } from "./abacatepay";
import { GatewayNotConfiguredError, type PaymentGateway } from "./types";

export function getPaymentGateway(): PaymentGateway {
  const provider = process.env.PAYMENT_PROVIDER ?? "abacatepay";
  if (provider === "abacatepay") {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) throw new GatewayNotConfiguredError();
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET ?? "";
    const apiUrl = process.env.ABACATEPAY_API_URL ?? "https://api.abacatepay.com/v2";
    return new AbacatePayGateway(apiKey, apiUrl, webhookSecret);
  }
  throw new Error(`PAYMENT_PROVIDER desconhecido: ${provider}`);
}

export {
  GatewayNotConfiguredError,
  GatewayWebhookError,
} from "./types";
export type {
  CreatePixInput,
  CreatePixOutput,
  PaymentGateway,
  PaymentStatus,
  WebhookVerifyInput,
  WebhookVerifyOutput,
} from "./types";
