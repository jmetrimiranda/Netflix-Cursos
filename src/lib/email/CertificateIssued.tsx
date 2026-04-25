type Props = {
  studentName: string;
  courseTitle: string;
  verificationUrl: string;
  pdfUrl: string | null;
};

export function renderCertificateIssuedEmail(props: Props): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Seu certificado da Ativa Engenharia";
  const text = `Olá, ${props.studentName}.

Parabéns! Você concluiu o curso "${props.courseTitle}" e seu certificado já está disponível.

${props.pdfUrl ? `Baixar certificado em PDF: ${props.pdfUrl}` : "Você pode baixar o PDF acessando sua área do curso."}

Verifique a autenticidade em: ${props.verificationUrl}

— Equipe Ativa Engenharia`;

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1a2f4a; line-height: 1.6; padding: 24px;">
    <h1 style="color: #1E3A5F;">Seu certificado está pronto</h1>
    <p>Olá, <strong>${props.studentName}</strong>.</p>
    <p>Parabéns! Você concluiu o curso <strong>${props.courseTitle}</strong> e seu certificado já está disponível.</p>
    ${
      props.pdfUrl
        ? `<p><a href="${props.pdfUrl}" style="background:#1E3A5F;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;">Baixar certificado (PDF)</a></p>`
        : "<p>Você pode baixar o PDF na sua área do curso.</p>"
    }
    <p>Você pode verificar a autenticidade do certificado a qualquer momento em:<br/>
    <a href="${props.verificationUrl}">${props.verificationUrl}</a></p>
    <p style="color:#3D5A80;font-size:12px;">— Equipe Ativa Engenharia</p>
  </body>
</html>`;
  return { subject, html, text };
}
