import { stripCpfMask } from "@/lib/cpf";
import { db } from "@/lib/db";
import { GatewayNotConfiguredError, getPaymentGateway } from "@/lib/payments";
import { checkoutCreateSchema } from "@/lib/validations/checkout";
import { NextResponse } from "next/server";

const PIX_TTL_SECONDS = 30 * 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = checkoutCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { courseId, studentEmail, studentName, studentCpf } = parsed.data;
  const cpfDigits = stripCpfMask(studentCpf);

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, priceCents: true, published: true },
  });
  if (!course || !course.published) {
    return NextResponse.json({ error: "Curso não disponível" }, { status: 404 });
  }

  // Carrega gateway (pode lançar se não configurado)
  let gateway: ReturnType<typeof getPaymentGateway>;
  try {
    gateway = getPaymentGateway();
  } catch (e) {
    if (e instanceof GatewayNotConfiguredError) {
      return NextResponse.json({ error: "Gateway de pagamento não configurado." }, { status: 503 });
    }
    throw e;
  }

  // Idempotência leve: se já existe enrollment+payment ainda válidos, reusa.
  const existing = await db.enrollment.findUnique({
    where: { studentEmail_courseId: { studentEmail, courseId } },
    select: {
      id: true,
      status: true,
      payment: {
        select: {
          id: true,
          status: true,
          qrCode: true,
          qrCodeBase64: true,
          expiresAt: true,
        },
      },
    },
  });

  if (existing?.status === "active") {
    return NextResponse.json({ error: "Você já tem acesso a este curso" }, { status: 409 });
  }

  if (
    existing?.status === "pending_payment" &&
    existing.payment &&
    existing.payment.status === "pending" &&
    existing.payment.expiresAt > new Date() &&
    existing.payment.qrCode &&
    existing.payment.qrCodeBase64
  ) {
    return NextResponse.json({
      paymentId: existing.payment.id,
      qrCode: existing.payment.qrCode,
      qrCodeBase64: existing.payment.qrCodeBase64,
      expiresAt: existing.payment.expiresAt.toISOString(),
    });
  }

  // Cria/atualiza enrollment + payment placeholder. Payment.mpPaymentId ainda
  // não existe, então usamos um sentinel `pending:<paymentLocalId>` antes do gateway.
  const expiresAtPlaceholder = new Date(Date.now() + PIX_TTL_SECONDS * 1000);
  const localPaymentSentinel = `pending:${crypto.randomUUID()}`;

  const { paymentId, enrollmentId } = await db.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.upsert({
      where: { studentEmail_courseId: { studentEmail, courseId } },
      update: { status: "pending_payment" },
      create: { studentEmail, courseId, status: "pending_payment" },
      select: { id: true, payment: { select: { id: true } } },
    });

    if (enrollment.payment) {
      // Reaproveita o registro
      const updated = await tx.payment.update({
        where: { id: enrollment.payment.id },
        data: {
          mpPaymentId: localPaymentSentinel,
          amountCents: course.priceCents,
          status: "pending",
          qrCode: null,
          qrCodeBase64: null,
          studentName,
          studentCpf: cpfDigits,
          expiresAt: expiresAtPlaceholder,
          paidAt: null,
        },
        select: { id: true },
      });
      return { paymentId: updated.id, enrollmentId: enrollment.id };
    }

    const created = await tx.payment.create({
      data: {
        enrollmentId: enrollment.id,
        mpPaymentId: localPaymentSentinel,
        amountCents: course.priceCents,
        status: "pending",
        studentName,
        studentCpf: cpfDigits,
        expiresAt: expiresAtPlaceholder,
      },
      select: { id: true },
    });
    return { paymentId: created.id, enrollmentId: enrollment.id };
  });

  // Chama gateway fora da transação.
  try {
    const out = await gateway.createPix({
      amountCents: course.priceCents,
      description: `Curso ${course.title}`,
      expiresInSeconds: PIX_TTL_SECONDS,
      externalId: paymentId,
      customer: {
        name: studentName,
        email: studentEmail,
        cpf: cpfDigits,
      },
    });

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        mpPaymentId: out.gatewayPaymentId,
        qrCode: out.qrCode,
        qrCodeBase64: out.qrCodeBase64,
        expiresAt: out.expiresAt,
      },
      select: { id: true, qrCode: true, qrCodeBase64: true, expiresAt: true },
    });

    return NextResponse.json({
      paymentId: updated.id,
      qrCode: updated.qrCode,
      qrCodeBase64: updated.qrCodeBase64,
      expiresAt: updated.expiresAt.toISOString(),
    });
  } catch (e) {
    await db.payment
      .update({ where: { id: paymentId }, data: { status: "rejected" } })
      .catch(() => {});
    console.error("Falha ao criar Pix no gateway:", e);
    void enrollmentId;
    return NextResponse.json({ error: "Falha ao gerar Pix" }, { status: 502 });
  }
}
