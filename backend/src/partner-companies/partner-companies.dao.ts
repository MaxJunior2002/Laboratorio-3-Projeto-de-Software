import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const partnerCompanySelection = {
  id: true,
  name: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
} satisfies Prisma.PartnerCompanySelect;

@Injectable()
export class PartnerCompaniesDao {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PartnerCompanyCreateInput) {
    return this.prisma.partnerCompany.create({
      data,
      select: partnerCompanySelection,
    });
  }

  findAll() {
    return this.prisma.partnerCompany.findMany({
      select: partnerCompanySelection,
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.partnerCompany.findUnique({
      where: { id },
      select: partnerCompanySelection,
    });
  }

  update(id: string, data: Prisma.PartnerCompanyUpdateInput) {
    return this.prisma.partnerCompany.update({
      where: { id },
      data,
      select: partnerCompanySelection,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const partnerCompany = await transaction.partnerCompany.findUniqueOrThrow(
        {
          where: { id },
          select: { userId: true },
        },
      );
      await transaction.user.delete({ where: { id: partnerCompany.userId } });
    });
  }
}
