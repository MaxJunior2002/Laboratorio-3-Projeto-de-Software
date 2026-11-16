import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { EmailService } from "../notifications/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRedemptionDto } from "./dto/create-redemption.dto";

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async redeem(studentUserId: string, dto: CreateRedemptionDto) {
    const [wallet, advantage] = await Promise.all([
      this.prisma.wallet.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      }),
      this.prisma.advantage.findUnique({
        where: { id: dto.advantageId },
        include: {
          partnerCompany: {
            include: { user: { select: { email: true } } },
          },
        },
      }),
    ]);

    if (!wallet) {
      throw new NotFoundException("Carteira do aluno não encontrada.");
    }
    if (!advantage || !advantage.active) {
      throw new NotFoundException("Vantagem indisponível.");
    }

    const code = randomBytes(16).toString("hex").toUpperCase();
    const notificationIds = await this.prisma.$transaction(
      async (transaction) => {
        const debit = await transaction.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: advantage.costInCoins } },
          data: { balance: { decrement: advantage.costInCoins } },
        });
        if (debit.count !== 1) {
          throw new BadRequestException(
            "Saldo insuficiente para resgatar a vantagem.",
          );
        }

        await transaction.transaction.create({
          data: {
            type: "REDEMPTION",
            amount: advantage.costInCoins,
            reason: advantage.description,
            redemptionCode: code,
            walletId: wallet.id,
            advantageId: advantage.id,
          },
        });
        return this.emailService.enqueue(transaction, [
          {
            recipient: (
              await transaction.user.findUniqueOrThrow({
                where: { id: studentUserId },
                select: { email: true },
              })
            ).email,
            subject: "Seu cupom de resgate",
            text: `Seu resgate de "${advantage.description}" foi confirmado. Apresente este código à empresa parceira: ${code}`,
          },
          {
            recipient: advantage.partnerCompany.user.email,
            subject: "Novo resgate de vantagem",
            text: `Foi realizado um resgate de "${advantage.description}". Código para conferência presencial: ${code}`,
          },
        ]);
      },
    );

    const notification = await this.emailService.dispatch(notificationIds);
    return {
      message: "Vantagem resgatada com sucesso.",
      redemptionCode: code,
      advantage: {
        id: advantage.id,
        description: advantage.description,
        costInCoins: advantage.costInCoins,
      },
      notification,
    };
  }

  async verify(partnerUserId: string, code: string) {
    const redemption = await this.prisma.transaction.findFirst({
      where: {
        redemptionCode: code,
        type: "REDEMPTION",
        advantage: { partnerCompany: { userId: partnerUserId } },
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        consumedAt: true,
        advantage: { select: { description: true } },
      },
    });
    if (!redemption) {
      throw new NotFoundException("Cupom inválido para esta empresa.");
    }
    if (redemption.consumedAt) {
      throw new ConflictException("Este cupom já foi utilizado.");
    }

    const consumedAt = new Date();
    const updated = await this.prisma.transaction.updateMany({
      where: { id: redemption.id, consumedAt: null },
      data: { consumedAt },
    });
    if (updated.count !== 1) {
      throw new ConflictException("Este cupom já foi utilizado.");
    }

    return {
      valid: true,
      consumedAt,
      amount: redemption.amount,
      advantage: redemption.advantage,
    };
  }
}
