import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

const studentSelection = {
  id: true,
  name: true,
  cpf: true,
  rg: true,
  address: true,
  course: true,
  userId: true,
  institutionId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true } },
  institution: { select: { id: true, name: true } },
} satisfies Prisma.StudentSelect;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    try {
      const passwordHash = await hash(dto.password, 12);
      return await this.prisma.student.create({
        data: {
          name: dto.name,
          cpf: dto.cpf,
          rg: dto.rg,
          address: dto.address,
          course: dto.course,
          institution: { connect: { id: dto.institutionId } },
          user: {
            create: {
              email: dto.email,
              passwordHash,
              wallet: { create: {} },
            },
          },
        },
        select: studentSelection,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.prisma.student.findMany({
      select: studentSelection,
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: studentSelection,
    });
    if (!student) {
      throw new NotFoundException("Aluno não encontrado.");
    }
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const { email, password, institutionId, ...studentData } = dto;
    const userData = {
      ...(email !== undefined && { email }),
      ...(password !== undefined && {
        passwordHash: await hash(password, 12),
      }),
    };

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...studentData,
          ...(institutionId && {
            institution: { connect: { id: institutionId } },
          }),
          ...(Object.keys(userData).length > 0 && {
            user: { update: userData },
          }),
        },
        select: studentSelection,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.student.delete({ where: { id } });
      return { message: "Aluno removido com sucesso." };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException(
        "E-mail, CPF ou RG já está cadastrado no sistema.",
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundException("Aluno ou instituição não encontrado(a).");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ConflictException(
        "Não é possível remover um aluno com movimentações vinculadas.",
      );
    }
    throw error;
  }
}
