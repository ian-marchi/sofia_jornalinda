export const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const schedule = [
  {
    day: "Segunda",
    title: "Matemática",
    weight: "Dia pesado",
    accent: "rose",
    tasks: [
      ["14:00-15:30", "Teoria de Matemática"],
      ["15:40-17:10", "Exercícios"],
      ["19:00-20:00", "Questões ENEM difíceis"],
      ["20:00-20:20", "Revisão de fórmulas"],
    ],
  },
  {
    day: "Terça",
    title: "Física + Redação",
    weight: "Educação física 16h-18h",
    accent: "sky",
    tasks: [
      ["13:30-15:00", "Física teoria"],
      ["15:00-15:40", "Questões rápidas"],
      ["19:00-20:00", "Redação: introdução, conclusão e repertório"],
      ["20:00-20:40", "Análise de redação nota 1000"],
    ],
  },
  {
    day: "Quarta",
    title: "Química",
    weight: "Ensaio de quadrilha 19h",
    accent: "mint",
    tasks: [
      ["13:30-15:00", "Química teoria"],
      ["15:10-16:30", "Exercícios"],
      ["16:40-17:20", "Revisão ativa e mapas mentais"],
      ["17:20-18:00", "Jantar e descanso antes do ensaio"],
    ],
  },
  {
    day: "Quinta",
    title: "Humanas + Linguagens",
    weight: "Curso às 18h",
    accent: "gold",
    tasks: [
      ["13:30-15:00", "Ciências Humanas"],
      ["15:10-16:00", "Questões ENEM"],
      ["16:10-17:00", "Linguagens e interpretação"],
      ["17:00-17:40", "Revisão leve ou atualidades"],
    ],
  },
  {
    day: "Sexta",
    title: "Biologia + Redação",
    weight: "Ensaio às 17h",
    accent: "rose",
    tasks: [
      ["13:30-15:00", "Biologia teoria"],
      ["15:10-16:00", "Exercícios"],
      ["20:00-21:00", "Redação completa ou correção"],
    ],
  },
  {
    day: "Sábado",
    title: "Matemática avançada + Simulado",
    weight: "Dia pesado",
    accent: "roseDeep",
    tasks: [
      ["13:30-15:00", "Matemática avançada"],
      ["15:10-17:10", "Simulado ENEM"],
      ["19:00-20:00", "Correção dos erros"],
    ],
  },
  {
    day: "Domingo",
    title: "Revisão leve ou descanso",
    weight: "Escolha o ritmo",
    accent: "mint",
    tasks: [
      ["16:00-17:00", "Flashcards, atualidades ou revisão rápida"],
      ["14:00-16:00", "Revisão geral da semana e caderno de erros"],
      ["Livre", "Descanso sem culpa"],
    ],
  },
];

export const monthlyGoals = [
  {
    key: "content",
    title: "Finalizar conteúdos prioritários",
    detail: "Matemática, Natureza e Redação em primeiro plano.",
  },
  {
    key: "essays",
    title: "Fazer redações",
    detail: "Comece com 1 completa por semana.",
    amountKey: "essays",
  },
  {
    key: "questions",
    title: "Resolver questões",
    detail: "Meta ideal: 120 a 150 por semana.",
    amountKey: "questions",
  },
  {
    key: "simulates",
    title: "Fazer simulados",
    detail: "Inclua correção dos erros no mesmo ciclo.",
    amountKey: "simulates",
  },
  {
    key: "errors",
    title: "Revisar caderno de erros semanalmente",
    detail: "Transforme erro repetido em revisão ativa.",
  },
];

export const reviewSeeds = [
  { date: "", subject: "Fórmulas de Matemática", area: "Matemática", action: "24 horas", done: false },
  { date: "", subject: "Redação: repertórios e conclusão", area: "Redação", action: "7 dias", done: false },
  { date: "", subject: "Física: eletricidade", area: "Natureza", action: "Questões", done: false },
  { date: "", subject: "Química orgânica", area: "Natureza", action: "Resumo ativo", done: false },
  { date: "", subject: "Atualidades da semana", area: "Humanas", action: "Domingo", done: false },
  { date: "", subject: "Erros mais repetidos", area: "Geral", action: "Caderno de erros", done: false },
];

export const focusAreas = [
  {
    title: "Matemática",
    accent: "rose",
    items: ["Porcentagem", "Funções", "Estatística", "Geometria", "Probabilidade"],
  },
  {
    title: "Natureza",
    accent: "mint",
    items: ["Ecologia", "Genética", "Eletricidade", "Química orgânica", "Estequiometria"],
  },
  {
    title: "Redação",
    accent: "gold",
    items: [
      "1 redação completa por semana agora",
      "2 redações por semana em 2026",
      "Introdução, conclusão e repertório",
      "Análise de redação nota 1000",
    ],
  },
];
