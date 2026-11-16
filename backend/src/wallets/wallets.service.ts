import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatement(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            type: true,
            amount: true,
            reason: true,
            redemptionCode: true,
            consumedAt: true,
            createdAt: true,
            advantage: { select: { description: true } },
          },
        },
      },
    });
    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada.");
    }
    return wallet;
  }
}
