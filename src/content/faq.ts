export type FaqItem = {
  question: string;
  answer: string;
};

export const faq: FaqItem[] = [
  {
    question: "Como me matriculo num curso?",
    answer:
      'Acesse o catálogo em /cursos, escolha o curso desejado e clique em "Começar". No primeiro acesso pediremos apenas seu email — não é necessário criar conta com senha. Seu progresso fica vinculado a esse email.',
  },
  {
    question: "Quanto custa o certificado?",
    answer:
      "O preço do certificado varia por curso e está sempre visível na página do curso. O valor é fixo e o pagamento é feito via Pix (Mercado Pago) somente após você concluir todas as aulas e ser aprovado na prova.",
  },
  {
    question: "O certificado tem validade?",
    answer:
      "O certificado emitido pela Ativa Engenharia é vitalício. Cada certificado recebe um código de verificação (formato EC-XXXXXXXX) que pode ser conferido publicamente em /verificar/[código] a qualquer momento.",
  },
  {
    question: "Vocês atendem apenas no Espírito Santo?",
    answer:
      "Nossa sede está em Vitória/ES e atendemos majoritariamente o estado, mas nossos responsáveis técnicos têm registro CREA-MT, CREA-BA e CREA-ES, o que permite atender projetos em outras regiões. Fale com a gente pelo WhatsApp para avaliarmos a sua demanda.",
  },
  {
    question: "Como solicito um orçamento de serviços de engenharia?",
    answer:
      "O caminho mais rápido é o WhatsApp 27 99818-3686 — respondemos no horário comercial. Você também pode enviar uma mensagem pelo formulário em /contato ou direto no email ativaengmec@gmail.com.",
  },
  {
    question: "Quais formas de pagamento vocês aceitam?",
    answer:
      "Para certificados de cursos, exclusivamente Pix via Mercado Pago. Para serviços de engenharia (laudos, projetos, inspeções), combinamos a forma de pagamento na proposta comercial — Pix, transferência ou boleto bancário.",
  },
  {
    question: "Em quanto tempo o certificado é emitido?",
    answer:
      "Assim que o Pix é confirmado pelo Mercado Pago (geralmente em segundos), o certificado em PDF é gerado automaticamente, salvo em nossa nuvem e enviado por email. Você também pode baixá-lo direto pela página do curso.",
  },
  {
    question: "Quem assina os laudos e projetos da Ativa?",
    answer:
      "Nossos responsáveis técnicos são Eduardo Bissoli (Eng. Mecânico e de Segurança do Trabalho — CREA MT-038597/D), Danilo Marquesini (Eng. Eletricista — CREA BA-300003660-7/D) e Renan Venturin Destefani (Eng. Civil — CREA ES-034006/D).",
  },
  {
    question: "Posso fazer o curso pelo celular?",
    answer:
      "Sim. A plataforma é totalmente responsiva — funciona em celulares, tablets e desktops. Recomendamos uma conexão estável de internet para reproduzir os vídeos sem interrupções.",
  },
  {
    question: "Quantas tentativas tenho na prova final?",
    answer:
      "Tentativas ilimitadas. A prova é gerada com questões sorteadas do banco do curso a cada tentativa, então o exercício também serve como revisão. Você só paga o certificado depois de ser aprovado.",
  },
];
