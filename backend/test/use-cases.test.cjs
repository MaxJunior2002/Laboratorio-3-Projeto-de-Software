require("reflect-metadata");

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { BadRequestException, ConflictException } = require("@nestjs/common");
const { AuthService } = require("../dist/src/auth/auth.service");
const {
  ProfessorsService,
} = require("../dist/src/professors/professors.service");
const {
  RedemptionsService,
} = require("../dist/src/redemptions/redemptions.service");

function transferDependencies(balance) {
  const calls = [];
  const prisma = {
    professor: {
      findUnique: async () => ({ institutionId: "institution-1" }),
    },
    wallet: {
      findUnique: async () => ({ id: "professor-wallet" }),
    },
    student: {
      findUnique: async () => ({
        id: "student-1",
        name: "Aluno",
        institutionId: "institution-1",
        user: {
          id: "student-user",
          email: "student@example.test",
          wallet: { id: "student-wallet" },
        },
      }),
    },
    $transaction: (callback) =>
      callback({
        wallet: {
          updateMany: async (args) => {
            calls.push(["debit", args]);
            return { count: balance >= args.where.balance.gte ? 1 : 0 };
          },
          update: async (args) => calls.push(["credit", args]),
        },
        transaction: {
          create: async (args) => calls.push(["transaction", args.data]),
        },
      }),
  };
  const emailService = {
    enqueue: async (_transaction, emails) => {
      calls.push(["emails", emails]);
      return ["outbox-1"];
    },
    dispatch: async () => ({
      status: "pending",
      pendingCount: 1,
      lastError: null,
    }),
  };
  return { calls, prisma, emailService };
}

test("não envia moedas quando o professor não tem saldo suficiente", async () => {
  const { calls, prisma, emailService } = transferDependencies(10);
  const service = new ProfessorsService(prisma, emailService);

  await assert.rejects(
    service.transferCoins("professor-user", {
      studentId: "student-1",
      amount: 20,
      reason: "Participação",
    }),
    (error) => error instanceof BadRequestException,
  );
  assert.deepEqual(
    calls.map(([type]) => type),
    ["debit"],
  );
});

test("transfere moedas, registra os dois extratos e enfileira a notificação", async () => {
  const { calls, prisma, emailService } = transferDependencies(100);
  const service = new ProfessorsService(prisma, emailService);

  const result = await service.transferCoins("professor-user", {
    studentId: "student-1",
    amount: 20,
    reason: "Participação",
  });

  assert.deepEqual(
    calls.map(([type]) => type),
    ["debit", "credit", "transaction", "transaction", "emails"],
  );
  assert.equal(calls[2][1].type, "TRANSFER_SENT");
  assert.equal(calls[3][1].type, "TRANSFER_RECEIVED");
  assert.equal(calls[4][1][0].recipient, "student@example.test");
  assert.equal(result.notification.status, "pending");
});

test("não repete crédito semestral quando a chave já existe", async () => {
  let balanceUpdates = 0;
  const prisma = {
    wallet: { findUnique: async () => ({ id: "professor-wallet" }) },
    $transaction: (callback) =>
      callback({
        transaction: {
          createMany: async ({ data, skipDuplicates }) => {
            assert.equal(data.type, "SEMESTER_CREDIT");
            assert.equal(data.amount, 1000);
            assert.equal(skipDuplicates, true);
            return { count: 0 };
          },
        },
        wallet: {
          update: async () => {
            balanceUpdates += 1;
          },
        },
      }),
  };
  const service = new AuthService(prisma);

  await service.grantSemesterCredit("professor-user");
  assert.equal(balanceUpdates, 0);
});

test("adiciona 1.000 moedas ao registrar um novo crédito semestral", async () => {
  const updates = [];
  const prisma = {
    wallet: { findUnique: async () => ({ id: "professor-wallet" }) },
    $transaction: (callback) =>
      callback({
        transaction: {
          createMany: async () => ({ count: 1 }),
        },
        wallet: {
          update: async (args) => updates.push(args),
        },
      }),
  };
  const service = new AuthService(prisma);

  await service.grantSemesterCredit("professor-user");
  assert.deepEqual(updates, [
    {
      where: { id: "professor-wallet" },
      data: { balance: { increment: 1000 } },
    },
  ]);
});

test("não desconta saldo nem cria resgate sem moedas suficientes", async () => {
  let createdTransactions = 0;
  const prisma = {
    wallet: { findUnique: async () => ({ id: "student-wallet" }) },
    advantage: {
      findUnique: async () => ({
        id: "advantage-1",
        description: "Desconto",
        costInCoins: 50,
        active: true,
        partnerCompany: { user: { email: "partner@example.test" } },
      }),
    },
    $transaction: (callback) =>
      callback({
        wallet: { updateMany: async () => ({ count: 0 }) },
        transaction: {
          create: async () => {
            createdTransactions += 1;
          },
        },
      }),
  };
  const service = new RedemptionsService(prisma, {});

  await assert.rejects(
    service.redeem("student-user", { advantageId: "advantage-1" }),
    (error) => error instanceof BadRequestException,
  );
  assert.equal(createdTransactions, 0);
});

test("consome cupom válido uma única vez", async () => {
  let consumedAt = null;
  const prisma = {
    transaction: {
      findFirst: async () => ({
        id: "redemption-1",
        amount: 50,
        createdAt: new Date(),
        consumedAt,
        advantage: { description: "Desconto" },
      }),
      updateMany: async ({ data }) => {
        if (consumedAt) return { count: 0 };
        consumedAt = data.consumedAt;
        return { count: 1 };
      },
    },
  };
  const service = new RedemptionsService(prisma, {});

  const result = await service.verify("partner-user", "REDEMPTION-CODE");
  assert.equal(result.valid, true);
  assert.ok(consumedAt instanceof Date);
  await assert.rejects(
    service.verify("partner-user", "REDEMPTION-CODE"),
    (error) => error instanceof ConflictException,
  );
});
