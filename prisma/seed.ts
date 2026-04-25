import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const db = new PrismaClient();

const EXAMPLE_COURSE_SLUG = "fundamentos-de-engenharia-civil";
const EXAMPLE_MODULE_TITLE = "Introdução";
const EXAMPLE_LESSON_TITLE = "Boas-vindas ao curso";

const EXAMPLE_QUESTIONS: { statement: string; correct: number; options: string[] }[] = [
  {
    statement: "Qual é a unidade de medida no SI para força?",
    correct: 0,
    options: ["Newton (N)", "Pascal (Pa)", "Joule (J)", "Watt (W)"],
  },
  {
    statement: "Em uma viga biapoiada, onde geralmente o momento fletor é máximo?",
    correct: 1,
    options: ["Nos apoios", "No meio do vão", "Nas extremidades em balanço", "Em qualquer ponto"],
  },
  {
    statement: "O que é o concreto armado?",
    correct: 2,
    options: [
      "Concreto sem aço",
      "Aço puro moldado",
      "Concreto reforçado com barras de aço",
      "Argamassa pura",
    ],
  },
  {
    statement: "Qual o principal componente do cimento Portland?",
    correct: 3,
    options: ["Areia", "Brita", "Água", "Clínquer"],
  },
  {
    statement: "Qual norma técnica brasileira regulamenta o projeto de concreto armado?",
    correct: 0,
    options: ["NBR 6118", "NBR 5410", "NBR 9050", "NBR 14931"],
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in the environment before running the seed.",
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  console.log(`Admin user ready: ${admin.email} (id=${admin.id})`);
}

async function seedExampleCourse() {
  const course = await db.course.upsert({
    where: { slug: EXAMPLE_COURSE_SLUG },
    update: {},
    create: {
      slug: EXAMPLE_COURSE_SLUG,
      title: "Fundamentos de Engenharia Civil",
      description:
        "Curso introdutório com os conceitos básicos de engenharia civil: estruturas, materiais e normas brasileiras. Conteúdo de exemplo gerado pelo seed.",
      category: "civil",
      priceCents: 9900,
      workloadHours: 20,
      examQuestionsCount: 10,
      published: true,
      featured: true,
    },
  });

  let moduleRecord = await db.module.findFirst({
    where: { courseId: course.id, title: EXAMPLE_MODULE_TITLE },
  });
  if (!moduleRecord) {
    moduleRecord = await db.module.create({
      data: { courseId: course.id, title: EXAMPLE_MODULE_TITLE, order: 0 },
    });
  }

  const existingLesson = await db.lesson.findFirst({
    where: { moduleId: moduleRecord.id, title: EXAMPLE_LESSON_TITLE },
  });
  if (!existingLesson) {
    await db.lesson.create({
      data: {
        moduleId: moduleRecord.id,
        title: EXAMPLE_LESSON_TITLE,
        order: 0,
        sidebarContent: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Material de apoio será exibido aqui ao lado do player.",
                },
              ],
            },
          ],
        },
      },
    });
  }

  for (const q of EXAMPLE_QUESTIONS) {
    const exists = await db.question.findFirst({
      where: { courseId: course.id, statement: q.statement },
    });
    if (exists) continue;
    await db.question.create({
      data: {
        courseId: course.id,
        statement: q.statement,
        active: true,
        options: q.options.map((text, idx) => ({
          id: `opt-${idx + 1}`,
          text,
          isCorrect: idx === q.correct,
        })),
      },
    });
  }

  console.log(`Example course ready: ${course.slug} (id=${course.id})`);
}

async function main() {
  await seedAdmin();
  await seedExampleCourse();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
