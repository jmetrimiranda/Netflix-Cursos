import { db } from "@/lib/db";
import { GatewayNotConfiguredError, getPaymentGateway } from "@/lib/payments";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await context.params;

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      mpPaymentId: true,
      status: true,
      qrCode: true,
      qrCodeBase64: true,
      expiresAt: true,
      enrollmentId: true,
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  const now = new Date();

  // Lazy expiry no servidor.
  if (payment.status === "pending" && payment.expiresAt < now) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "expired" } });
    return NextResponse.json({
      status: "expired",
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      expiresAt: payment.expiresAt.toISOString(),
    });
  }

  // Fallback: webhook pode não ter chegado. Consulta gateway diretamente.
  if (
    payment.status === "pending" &&
    payment.expiresAt >= now &&
    !payment.mpPaymentId.startsWith("pending:")
  ) {
    try {
      const gateway = getPaymentGateway();
      const remoteStatus = await gateway.getStatus(payment.mpPaymentId);
      if (remoteStatus === "approved") {
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
        return NextResponse.json({
          status: "approved",
          qrCode: payment.qrCode,
          qrCodeBase64: payment.qrCodeBase64,
          expiresAt: payment.expiresAt.toISOString(),
        });
      }
      if (remoteStatus === "rejected" || remoteStatus === "expired") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: remoteStatus },
        });
        return NextResponse.json({
          status: remoteStatus,
          qrCode: payment.qrCode,
          qrCodeBase64: payment.qrCodeBase64,
          expiresAt: payment.expiresAt.toISOString(),
        });
      }
    } catch (e) {
      if (!(e instanceof GatewayNotConfiguredError)) {
        console.warn("Fallback gateway.getStatus falhou:", e);
      }
    }
  }

  return NextResponse.json({
    status: payment.status,
    qrCode: payment.qrCode,
    qrCodeBase64: payment.qrCodeBase64,
    expiresAt: payment.expiresAt.toISOString(),
  });
}
