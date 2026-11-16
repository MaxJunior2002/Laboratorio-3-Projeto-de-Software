import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdvantageDto } from "./dto/create-advantage.dto";
import { UpdateAdvantageDto } from "./dto/update-advantage.dto";

@Injectable()
export class AdvantagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAvailable() {
    return this.prisma.advantage.findMany({
      where: { active: true },
      select: {
        id: true,
        description: true,
        photoUrl: true,
        costInCoins: true,
        partnerCompany: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findForPartner(partnerCompanyId: string) {
    return this.prisma.advantage.findMany({
      where: { partnerCompanyId },
      orderBy: { createdAt: "desc" },
    });
  }

  create(partnerCompanyId: string, dto: CreateAdvantageDto) {
    return this.prisma.advantage.create({
      data: {
        ...dto,
        partnerCompany: { connect: { id: partnerCompanyId } },
      },
    });
  }

  async update(id: string, partnerCompanyId: string, dto: UpdateAdvantageDto) {
    const updated = await this.prisma.advantage.updateMany({
      where: { id, partnerCompanyId },
      data: dto,
    });
    if (updated.count !== 1) {
      throw new NotFoundException("Vantagem não encontrada para esta empresa.");
    }
    return this.prisma.advantage.findUniqueOrThrow({ where: { id } });
  }

  async deactivate(id: string, partnerCompanyId: string) {
    const updated = await this.prisma.advantage.updateMany({
      where: { id, partnerCompanyId },
      data: { active: false },
    });
    if (updated.count !== 1) {
      throw new NotFoundException("Vantagem não encontrada para esta empresa.");
    }
    return { message: "Vantagem desativada." };
  }
}
