import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePartnerCompanyDto } from "./dto/create-partner-company.dto";
import { UpdatePartnerCompanyDto } from "./dto/update-partner-company.dto";

const partnerCompanySelection = {
  id: true,
  name: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
} satisfies Prisma.PartnerCompanySelect;

@Injectable()
export class PartnerCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartnerCompanyDto) {
    try {
      const passwordHash = await hash(dto.password, 12);
      return await this.prisma.partnerCompany.create({
        data: {
          name: dto.name,
          user: {
            create: { email: dto.email, passwordHash },
          },
        },
        select: partnerCompanySelection,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.prisma.partnerCompany.findMany({
      select: partnerCompanySelection,
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const partnerCompany = await this.prisma.partnerCompany.findUnique({
      where: { id },
      select: partnerCompanySelection,
    });
    if (!partnerCompany) {
      throw new NotFoundException("Empresa parceira não encontrada.");
    }
    return partnerCompany;
  }

  async update(id: string, dto: UpdatePartnerCompanyDto) {
    const { email, password, ...companyData } = dto;
    const userData = {
      ...(email !== undefined && { email }),
      ...(password !== undefined && {
        passwordHash: await hash(password, 12),
      }),
    };

    try {
      return await this.prisma.partnerCompany.update({
        where: { id },
        data: {
          ...companyData,
          ...(Object.keys(userData).length > 0 && {
            user: { update: userData },
          }),
        },
        select: partnerCompanySelection,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.partnerCompany.delete({ where: { id } });
      return { message: "Empresa parceira removida com sucesso." };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("E-mail já cadastrado no sistema.");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundException("Empresa parceira não encontrada.");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ConflictException(
        "Não é possível remover uma empresa com transações vinculadas.",
      );
    }
    throw error;
  }
}
