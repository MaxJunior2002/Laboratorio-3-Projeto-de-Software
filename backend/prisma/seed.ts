import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.institution.upsert({
    where: { name: "Pontifícia Universidade Católica de Minas Gerais" },
    update: {},
    create: { name: "Pontifícia Universidade Católica de Minas Gerais" },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
