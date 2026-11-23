import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getConfiguredValues(prefix: string, keys: string[], enabled: boolean) {
  const values: Record<string, string> = {};
  for (const key of keys) {
    values[key] = process.env[`${prefix}${key}`]?.trim() ?? "";
  }
  const configuredCount = Object.values(values).filter(Boolean).length;

  if (!enabled && configuredCount > 0) {
    throw new Error(`Configure ${prefix} somente com SEED_DEMO_ACCOUNTS=true.`);
  }
  if (enabled && configuredCount !== keys.length) {
    throw new Error(
      `Configure todas as variáveis ${prefix} para criar a conta.`,
    );
  }

  return values;
}

async function ensureDemoUser(
  email: string,
  password: string,
  profile: "student" | "professor" | "partnerCompany",
  profileData: Record<string, string>,
  institutionId?: string,
) {
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { student: true, professor: true, partnerCompany: true },
  });
  const existingProfile = existing?.[profile];

  if (existing && !existingProfile) {
    throw new Error(
      `O e-mail ${email} já pertence a um perfil diferente de ${profile}.`,
    );
  }

  const passwordHash = await hash(password, 12);
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        [profile]: {
          create: {
            ...profileData,
            ...(institutionId && { institutionId }),
          },
        },
        ...(profile !== "partnerCompany" && { wallet: { create: {} } }),
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash,
      [profile]: {
        update: {
          ...profileData,
          ...(institutionId && { institutionId }),
        },
      },
      ...(profile !== "partnerCompany" && {
        wallet: {
          upsert: { update: {}, create: {} },
        },
      }),
    },
  });
}

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

  const demoFlag = process.env.SEED_DEMO_ACCOUNTS?.toLowerCase();
  if (demoFlag && demoFlag !== "true" && demoFlag !== "false") {
    throw new Error("SEED_DEMO_ACCOUNTS deve ser true ou false.");
  }
  const demoAccountsEnabled = demoFlag === "true";
  if (demoAccountsEnabled) {
    const student = getConfiguredValues(
      "SEED_DEMO_STUDENT_",
      ["EMAIL", "PASSWORD", "NAME", "CPF", "RG", "ADDRESS", "COURSE"],
      true,
    );
    const professor = getConfiguredValues(
      "SEED_DEMO_PROFESSOR_",
      ["EMAIL", "PASSWORD", "NAME", "CPF", "DEPARTMENT"],
      true,
    );
    const company = getConfiguredValues(
      "SEED_DEMO_COMPANY_",
      ["EMAIL", "PASSWORD", "NAME"],
      true,
    );

    for (const account of [student, professor, company]) {
      if (account.PASSWORD.length < 8) {
        throw new Error(
          "As senhas das contas demonstrativas devem ter ao menos 8 caracteres.",
        );
      }
    }

    await ensureDemoUser(
      student.EMAIL,
      student.PASSWORD,
      "student",
      {
        name: student.NAME,
        cpf: student.CPF,
        rg: student.RG,
        address: student.ADDRESS,
        course: student.COURSE,
      },
      institution.id,
    );
    await ensureDemoUser(
      professor.EMAIL,
      professor.PASSWORD,
      "professor",
      {
        name: professor.NAME,
        cpf: professor.CPF,
        department: professor.DEPARTMENT,
      },
      institution.id,
    );
    await ensureDemoUser(company.EMAIL, company.PASSWORD, "partnerCompany", {
      name: company.NAME,
    });
  } else {
    getConfiguredValues(
      "SEED_DEMO_STUDENT_",
      ["EMAIL", "PASSWORD", "NAME", "CPF", "RG", "ADDRESS", "COURSE"],
      false,
    );
    getConfiguredValues(
      "SEED_DEMO_PROFESSOR_",
      ["EMAIL", "PASSWORD", "NAME", "CPF", "DEPARTMENT"],
      false,
    );
    getConfiguredValues(
      "SEED_DEMO_COMPANY_",
      ["EMAIL", "PASSWORD", "NAME"],
      false,
    );
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
