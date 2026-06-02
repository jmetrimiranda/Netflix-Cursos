import { db } from "@/lib/db";
import { sendCertificateEmail } from "@/lib/email";
import { CertificateTemplate } from "@/lib/pdf/CertificateTemplate";
import { R2NotConfiguredError, uploadPdfToR2 } from "@/lib/r2";
import { generateVerificationCode } from "@/lib/verification-code";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function maskCpf(digits: string): string {
  const d = digits.replace(/\D/g, "").padStart(11, "0").slice(0, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export async function issueCertificateIfNeeded(enrollmentId: string) {
  const existing = await db.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      studentEmail: true,
      course: {
        select: {
          id: true,
          title: true,
          workloadHours: true,
          examPassScore: true,
          certificateCourseName: true,
          certificateValidity: true,
          examScopeTitle: true,
          examScopeSubtitle: true,
          examScopeTopics: true,
        },
      },
      payment: {
        select: { status: true, studentName: true, studentCpf: true },
      },
      examAttempts: {
        where: { passed: true },
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: { id: true, score: true, submittedAt: true },
      },
    },
  });
  if (!enrollment) throw new Error("Enrollment não encontrado");
  if (!enrollment.payment || enrollment.payment.status !== "approved") {
    throw new Error("Pagamento não aprovado");
  }
  if (enrollment.examAttempts.length === 0) {
    throw new Error("Nenhuma tentativa de prova aprovada");
  }

  const verificationCode = generateVerificationCode();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const verificationUrl = `${appUrl}/verificar/${verificationCode}`;

  const issuedAt = new Date();
  const cpfMasked = maskCpf(enrollment.payment.studentCpf);

  const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
    type: "png",
    width: 240,
    margin: 0,
  });

  const pdfBuffer = await renderToBuffer(
    CertificateTemplate({
      studentName: enrollment.payment.studentName,
      studentCpfMasked: cpfMasked,
      courseTitle: enrollment.course.title,
      workloadHours: enrollment.course.workloadHours,
      issuedAtBR: formatDateBR(issuedAt),
      verificationCode,
      verificationUrl,
      qrPngBuffer,
      certificateCourseName: enrollment.course.certificateCourseName,
      certificateValidity: enrollment.course.certificateValidity,
      examScopeTitle: enrollment.course.examScopeTitle,
      examScopeSubtitle: enrollment.course.examScopeSubtitle,
      examScopeTopics: enrollment.course.examScopeTopics,
    }),
  );

  let pdfUrl: string | null = null;
  try {
    pdfUrl = await uploadPdfToR2(`certificates/${verificationCode}.pdf`, pdfBuffer);
  } catch (e) {
    if (e instanceof R2NotConfiguredError) {
      console.warn("[certificates] R2 não configurado — certificado sem URL pública.");
    } else {
      throw e;
    }
  }

  const cert = await db.certificate.create({
    data: {
      enrollmentId,
      verificationCode,
      pdfUrl,
      studentName: enrollment.payment.studentName,
      studentCpf: enrollment.payment.studentCpf,
      courseTitle: enrollment.course.title,
      workloadHours: enrollment.course.workloadHours,
      issuedAt,
    },
  });

  try {
    await sendCertificateEmail({
      to: enrollment.studentEmail,
      studentName: enrollment.payment.studentName,
      courseTitle: enrollment.course.title,
      verificationUrl,
      pdfUrl,
    });
  } catch (e) {
    console.warn("[certificates] Falha ao enviar email:", e);
  }

  return cert;
}
