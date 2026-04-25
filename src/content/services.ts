export type ServiceGroup = {
  slug: string;
  title: string;
  description: string;
  services: string[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    slug: "climatizacao",
    title: "Climatização",
    description:
      "Projetos, manutenção e conformidade legal de sistemas de ar condicionado e qualidade do ar.",
    services: [
      "PMOC — Plano de Manutenção, Operação e Controle",
      "Qualidade do ar em ambientes climatizados",
      "Projetos de climatização e renovação de ar",
      "Análise de carga térmica",
      "Inspeção termográfica",
    ],
  },
  {
    slug: "eletrica",
    title: "Elétrica",
    description: "Da concepção do projeto à manutenção preditiva, com responsável técnico CREA-BA.",
    services: [
      "Projetos elétricos",
      "Laudo, inspeção e avaliação de SPDA",
      "Plano de manutenção em geradores",
      "Plano de manutenção de empilhadeiras",
      "Projeto e implementação de sistema solar fotovoltaico",
    ],
  },
  {
    slug: "mecanica",
    title: "Mecânica",
    description:
      "Adequação a NRs e laudos técnicos para máquinas, equipamentos e vasos sob pressão.",
    services: [
      "Adequação de máquinas e equipamentos NR-12",
      "Inspeção e laudo de caldeiras e vasos de pressão NR-13",
      "Regularização e projetos de linha de vida",
    ],
  },
  {
    slug: "civil-hidraulica",
    title: "Civil & Hidráulica",
    description:
      "Projetos civis e hidrossanitários assinados por engenheiro civil credenciado pelo CREA-ES.",
    services: [
      "Projeto civil e hidrossanitário",
      "Projeto e implementação de sistema de combate a incêndio",
    ],
  },
  {
    slug: "seguranca-do-trabalho",
    title: "Segurança do Trabalho",
    description:
      "Programas legais e gestão de NRs com responsável técnico em segurança do trabalho.",
    services: [
      "PCMSO — Programa de Controle Médico de Saúde Ocupacional",
      "PGR — Programa de Gerenciamento de Riscos",
      "LTCAT — Laudo Técnico das Condições Ambientais do Trabalho",
      "AET — Análise Ergonômica do Trabalho",
      "Gerenciamento e-Social (eventos SST)",
      "Implementação de NRs",
    ],
  },
  {
    slug: "outros",
    title: "Outros serviços",
    description: "Inspeções especializadas, perícias, ARTs e consultoria técnica multidisciplinar.",
    services: [
      "Plano de Controle Ambiental",
      "Consultoria técnica em engenharia",
      "Perícia técnica",
      "Emissão e regularização de ARTs",
      "Inspeção com drone",
      "Inspeção e limpeza de dutos robotizada",
    ],
  },
];
