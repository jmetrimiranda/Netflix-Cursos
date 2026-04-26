import { renderCertificateIssuedEmail } from "@/lib/email/CertificateIssued";

type SendInput = {
  to: string;
  studentName: string;
  courseTitle: string;
  verificationUrl: string;
  pdfUrl: string | null;
};

export async function sendCertificateEmail(input: SendInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "Ativa Engenharia <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY ausente — pulando envio do certificado.");
    return;
  }

  const { subject, html, text } = renderCertificateIssuedEmail({
    studentName: input.studentName,
    courseTitle: input.courseTitle,
    verificationUrl: input.verificationUrl,
    pdfUrl: input.pdfUrl,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn(`[email] Resend HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.warn("[email] Falha de rede ao enviar via Resend:", e);
  }
}
