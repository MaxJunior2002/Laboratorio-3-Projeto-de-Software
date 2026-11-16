import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";

@Injectable()
export class ProfessorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async transferCoins(professorUserId: string, dto: CreateTransferDto) {
    const reason = dto.reason.trim();
    const [professor, professorWallet, student] = await Promise.all([
      this.prisma.professor.findUnique({
        where: { userId: professorUserId },
        select: { institutionId: true },
      }),
      this.prisma.wallet.findUnique({
        where: { userId: professorUserId },
        select: { id: true },
      }),
      this.prisma.student.findUnique({
        where: { id: dto.studentId },
        select: {
          id: true,
          name: true,
          institutionId: true,
          user: {
            select: { id: true, email: true, wallet: { select: { id: true } } },
          },
        },
      }),
    ]);
    if (!professor || !professorWallet) {
      throw new NotFoundException("Carteira do professor não encontrada.");
    }
    const studentWalletId = student?.user.wallet?.id;
    if (!student || !studentWalletId) {
      throw new NotFoundException("Aluno ou carteira não encontrado(a).");
    }
    if (student.institutionId !== professor.institutionId) {
      throw new NotFoundException(
        "Aluno não encontrado na instituição do professor.",
      );
    }

    const notificationIds = await this.prisma.$transaction(
      async (transaction) => {
        const debit = await transaction.wallet.updateMany({
          where: {
            id: professorWallet.id,
            balance: { gte: dto.amount },
          },
          data: { balance: { decrement: dto.amount } },
        });
        if (debit.count !== 1) {
          throw new BadRequestException(
            "Saldo insuficiente para realizar o envio.",
          );
        }

        await transaction.wallet.update({
          where: { id: studentWalletId },
          data: { balance: { increment: dto.amount } },
        });
        await transaction.transaction.create({
          data: {
            type: "TRANSFER_SENT",
            amount: dto.amount,
            reason,
            walletId: professorWallet.id,
            relatedWalletId: studentWalletId,
          },
        });
        await transaction.transaction.create({
          data: {
            type: "TRANSFER_RECEIVED",
            amount: dto.amount,
            reason,
            walletId: studentWalletId,
            relatedWalletId: professorWallet.id,
          },
        });
        return this.emailService.enqueue(transaction, [
          {
            recipient: student.user.email,
            subject: "Você recebeu moedas estudantis",
            text: `Olá, ${student.name}. Você recebeu ${dto.amount} moedas do seu professor. Motivo: ${reason}`,
          },
        ]);
      },
    );

    const notification = await this.emailService.dispatch(notificationIds);
    return {
      message: "Moedas enviadas com sucesso.",
      amount: dto.amount,
      studentId: student.id,
      notification,
    };
  }
}
