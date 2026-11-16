import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const institution = await prisma.institution.upsert({
    where: { name: "Pontifícia Universidade Católica de Minas Gerais" },
    update: {},
    create: { name: "Pontifícia Universidade Católica de Minas Gerais" },
  });

  const professorValues = {
    email: process.env.SEED_PROFESSOR_EMAIL,
    password: process.env.SEED_PROFESSOR_PASSWORD,
    name: process.env.SEED_PROFESSOR_NAME,
    cpf: process.env.SEED_PROFESSOR_CPF,
    department: process.env.SEED_PROFESSOR_DEPARTMENT,
  };
  const configuredValues = Object.values(professorValues).filter(Boolean);
  if (configuredValues.length > 0 && configuredValues.length < 5) {
    throw new Error(
      "Configure todos os valores SEED_PROFESSOR_* para pré-cadastrar um professor.",
    );
  }

  if (configuredValues.length === 5) {
    const existing = await prisma.user.findUnique({
      where: { email: professorValues.email },
      include: { professor: true, student: true, partnerCompany: true },
    });
    if (existing && !existing.professor) {
      throw new Error(
        "O e-mail SEED_PROFESSOR_EMAIL já pertence a outro perfil.",
      );
    }

    if (!existing) {
      await prisma.user.create({
        data: {
          email: professorValues.email!,
          passwordHash: await hash(professorValues.password!, 12),
          professor: {
            create: {
              name: professorValues.name!,
              cpf: professorValues.cpf!,
              department: professorValues.department!,
              institutionId: institution.id,
            },
          },
          wallet: { create: {} },
        },
      });
    } else {
      await prisma.wallet.upsert({
        where: { userId: existing.id },
        update: {},
        create: { userId: existing.id },
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
