import { rateLimitResponse } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const contactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(8).max(40),
  message: z.string().trim().min(10).max(4000),
  lgpdConsent: z.literal(true, { message: "Consentimento LGPD obrigatório" }),
});

const TO_EMAIL = "ativaengmec@gmail.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(p: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  const msg = escapeHtml(p.message).replace(/\n/g, "<br/>");
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#1E3A5F">Novo contato pelo site</h2>
      <p><strong>Nome:</strong> ${escapeHtml(p.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${encodeURIComponent(p.email)}">${escapeHtml(p.email)}</a></p>
      <p><strong>Telefone:</strong> ${escapeHtml(p.phone)}</p>
      <p><strong>Mensagem:</strong></p>
      <div style="background:#f4f6fa;border-radius:8px;padding:12px;white-space:normal">${msg}</div>
      <hr style="margin-top:24px;border:none;border-top:1px solid #e2e8f0"/>
      <p style="color:#64748b;font-size:12px">Enviado pelo formulário /contato do site Ativa Engenharia.</p>
    </div>
  `.trim();
}

function renderText(p: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  return [
    "Novo contato pelo site Ativa Engenharia",
    "",
    `Nome: ${p.name}`,
    `Email: ${p.email}`,
    `Telefone: ${p.phone}`,
    "",
    "Mensagem:",
    p.message,
  ].join("\n");
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "contact", {
    max: 3,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = contactPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "Ativa Engenharia <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("[contact] RESEND_API_KEY ausente — retornando 503 para fallback mailto.");
    return NextResponse.json({ error: "Envio temporariamente indisponível" }, { status: 503 });
  }

  const { name, email, phone, message } = parsed.data;
  const subject = `[Site] Contato de ${name}`;
  const html = renderHtml({ name, email, phone, message });
  const text = renderText({ name, email, phone, message });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: TO_EMAIL,
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[contact] Resend HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      return NextResponse.json(
        { error: "Não foi possível enviar a mensagem agora." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[contact] Falha de rede ao enviar via Resend:", e);
    return NextResponse.json({ error: "Falha de rede ao enviar a mensagem." }, { status: 502 });
  }
}
