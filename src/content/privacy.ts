/**
 * Texto da Política de Privacidade — versionado em TS (ADR-011).
 * Atualizar = commit + deploy.
 *
 * Última revisão: 2026-04-26.
 */

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const privacy = {
  lastUpdated: "26 de abril de 2026",
  controller: {
    name: "Ativa Engenharia",
    cnpj: "29.974.056/0001-29",
    contactEmail: "ativaengmec@gmail.com",
    contactWhatsapp: "27 99818-3686",
  },
  intro:
    "Esta Política descreve como a Ativa Engenharia coleta, usa e protege os dados pessoais de visitantes e alunos da plataforma de cursos, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
  sections: [
    {
      id: "dados-coletados",
      title: "1. Dados que coletamos",
      paragraphs: [
        "Coletamos somente os dados necessários para prestar nossos serviços de forma adequada:",
      ],
      bullets: [
        "**Email** — informado quando você inicia o checkout de um curso. Usado para identificar sua matrícula, enviar o certificado e dar suporte.",
        "**Nome completo** — informado no checkout. Aparece impresso no certificado.",
        "**CPF** — informado no checkout. Aparece (mascarado) no certificado e na verificação pública.",
        "**Telefone** — opcional, somente quando você usa o formulário de contato.",
        "**Dados técnicos** — endereço IP e User-Agent, registrados em logs por até 30 dias para segurança e proteção contra abuso.",
        "**Dados de pagamento** — processados diretamente pela AbacatePay (gateway autorizado pelo Banco Central). Não armazenamos número de cartão; do Pix retemos apenas o ID da transação para conciliação.",
      ],
    },
    {
      id: "finalidade",
      title: "2. Para que usamos seus dados",
      paragraphs: ["Tratamos seus dados exclusivamente para:"],
      bullets: [
        "Liberar acesso ao curso adquirido (vinculado ao seu email).",
        "Emitir o certificado em PDF com seu nome, CPF e dados do curso.",
        "Disponibilizar a verificação pública de autenticidade do certificado em /verificar/<código>.",
        "Enviar comunicações operacionais (confirmação de pagamento, link do certificado, suporte).",
        "Atender solicitações enviadas pelo formulário de contato.",
        "Cumprir obrigações legais e fiscais.",
      ],
    },
    {
      id: "base-legal",
      title: "3. Base legal (LGPD art. 7º)",
      paragraphs: ["Cada tratamento se ampara em uma base legal específica:"],
      bullets: [
        "**Execução de contrato** (art. 7º, V): coleta de email/nome/CPF para entrega do curso e emissão do certificado.",
        "**Consentimento** (art. 7º, I): formulário de contato e marketing futuro (quando aplicável).",
        "**Cumprimento de obrigação legal** (art. 7º, II): retenção de dados fiscais por 5 anos.",
        "**Legítimo interesse** (art. 7º, IX): logs técnicos para segurança e prevenção a fraudes.",
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Com quem compartilhamos",
      paragraphs: [
        "Para operar a plataforma, contamos com prestadores de serviço sujeitos a contrato:",
      ],
      bullets: [
        "**AbacatePay** — gateway de pagamento Pix (cliente envia CPF + nome diretamente).",
        "**Resend** — envio de emails transacionais (entrega do certificado e confirmações).",
        "**Cloudflare R2** — armazenamento dos PDFs de certificado.",
        "**Bunny Stream** — hospedagem e entrega de vídeos das aulas.",
        "**Vercel + Neon** — infraestrutura de hospedagem e banco de dados.",
      ],
    },
    {
      id: "retencao",
      title: "5. Por quanto tempo guardamos",
      paragraphs: ["Mantemos seus dados pelo tempo necessário para as finalidades acima:"],
      bullets: [
        "**Certificado emitido** — retenção indefinida (o certificado é vitalício e precisa permanecer verificável).",
        "**Matrícula em curso** — enquanto durar o seu acesso (vitalício, salvo cancelamento por reembolso).",
        "**Mensagens de contato** — até 12 meses após o último contato.",
        "**Logs técnicos** — até 30 dias.",
        "**Dados fiscais** — 5 anos, conforme legislação tributária.",
      ],
    },
    {
      id: "direitos",
      title: "6. Seus direitos (LGPD art. 18)",
      paragraphs: ["Você pode, a qualquer momento, exercer os seguintes direitos:"],
      bullets: [
        "Confirmar a existência de tratamento dos seus dados.",
        "Acessar os dados que temos sobre você.",
        "Corrigir dados incompletos, inexatos ou desatualizados.",
        "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.",
        "Revogar consentimento (quando essa for a base legal).",
        "Solicitar portabilidade dos seus dados.",
        "Ser informado sobre as entidades com as quais compartilhamos seus dados.",
      ],
    },
    {
      id: "encarregado",
      title: "7. Como exercer seus direitos",
      paragraphs: [
        "Envie sua solicitação ao encarregado pelo tratamento de dados (DPO) pelo email ativaengmec@gmail.com ou pelo WhatsApp 27 99818-3686. Responderemos em até 15 dias úteis.",
        "Em caso de discordância com nossa resposta, você pode também recorrer à Autoridade Nacional de Proteção de Dados (ANPD) em www.gov.br/anpd.",
      ],
    },
    {
      id: "seguranca",
      title: "8. Segurança",
      paragraphs: [
        "Adotamos medidas técnicas e administrativas para proteger seus dados: criptografia em trânsito (HTTPS), senhas armazenadas com hash Argon2, controle de acesso por autenticação, e infraestrutura em provedores com certificações reconhecidas (Vercel, Neon, Cloudflare).",
        "Em caso de incidente que possa acarretar risco aos titulares, seguiremos o protocolo da ANPD (notificação em prazo razoável e comunicação aos titulares afetados).",
      ],
    },
    {
      id: "alteracoes",
      title: "9. Alterações nesta política",
      paragraphs: [
        "Esta Política pode ser atualizada quando houver mudança nos serviços ou na legislação. A versão vigente é sempre a publicada nesta página, com a data da última revisão indicada no topo.",
      ],
    },
  ] satisfies PrivacySection[],
};
