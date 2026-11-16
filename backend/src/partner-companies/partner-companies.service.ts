import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { CreatePartnerCompanyDto } from "./dto/create-partner-company.dto";
import { UpdatePartnerCompanyDto } from "./dto/update-partner-company.dto";
import { PartnerCompaniesDao } from "./partner-companies.dao";

@Injectable()
export class PartnerCompaniesService {
  constructor(private readonly partnerCompaniesDao: PartnerCompaniesDao) {}

  async create(dto: CreatePartnerCompanyDto) {
    try {
      const passwordHash = await hash(dto.password, 12);
      return await this.partnerCompaniesDao.create({
        name: dto.name,
        user: {
          create: { email: dto.email, passwordHash },
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.partnerCompaniesDao.findAll();
  }

  async findOne(id: string, requesterId: string) {
    const partnerCompany = await this.partnerCompaniesDao.findById(id);
    if (!partnerCompany || partnerCompany.userId !== requesterId) {
      throw new NotFoundException("Empresa parceira não encontrada.");
    }
    return partnerCompany;
  }

  async update(id: string, requesterId: string, dto: UpdatePartnerCompanyDto) {
    const company = await this.partnerCompaniesDao.findById(id);
    if (!company || company.userId !== requesterId) {
      throw new NotFoundException("Empresa parceira não encontrada.");
    }
    const { email, password, ...companyData } = dto;
    const userData = {
      ...(email !== undefined && { email }),
      ...(password !== undefined && {
        passwordHash: await hash(password, 12),
      }),
    };

    try {
      return await this.partnerCompaniesDao.update(id, {
        ...companyData,
        ...(Object.keys(userData).length > 0 && {
          user: { update: userData },
        }),
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string, requesterId: string) {
    try {
      const company = await this.partnerCompaniesDao.findById(id);
      if (!company || company.userId !== requesterId) {
        throw new NotFoundException("Empresa parceira não encontrada.");
      }
      await this.partnerCompaniesDao.deleteById(id);
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
