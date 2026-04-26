import { db } from "@/lib/db";
import { GatewayNotConfiguredError, GatewayWebhookError, getPaymentGateway } from "@/lib/payments";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.ABACATEPAY_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 503 });
  }

  const rawBody = await request.text();

  let gateway: ReturnType<typeof getPaymentGateway>;
  try {
    gateway = getPaymentGateway();
  } catch (e) {
    if (e instanceof GatewayNotConfiguredError) {
      return NextResponse.json({ error: "Gateway não configurado" }, { status: 503 });
    }
    throw e;
  }

  let verified: { gatewayPaymentId: string; status: string };
  try {
    verified = gateway.verifyWebhook({
      headers: Object.fromEntries(request.headers.entries()),
      rawBody,
    });
  } catch (e) {
    if (e instanceof GatewayWebhookError || e instanceof GatewayNotConfiguredError) {
      console.warn("[webhook] verifyWebhook falhou:", e.message);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw e;
  }

  const payment = await db.payment.findUnique({
    where: { mpPaymentId: verified.gatewayPaymentId },
    select: { id: true, status: true, enrollmentId: true },
  });
  // Idempotente: se não é nosso, 200.
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  const remoteStatus = verified.status;

  if (remoteStatus === "approved" && payment.status !== "approved") {
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { status: "approved", paidAt: new Date() },
      }),
      db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: "active" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if ((remoteStatus === "expired" || remoteStatus === "rejected") && payment.status === "pending") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: remoteStatus },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
