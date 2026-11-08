import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsDao } from "./students.dao";

@Injectable()
export class StudentsService {
  constructor(private readonly studentsDao: StudentsDao) {}

  async create(dto: CreateStudentDto) {
    try {
      const passwordHash = await hash(dto.password, 12);
      return await this.studentsDao.create({
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
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.studentsDao.findAll();
  }

  async findOne(id: string) {
    const student = await this.studentsDao.findById(id);
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
      return await this.studentsDao.update(id, {
        ...studentData,
        ...(institutionId && {
          institution: { connect: { id: institutionId } },
        }),
        ...(Object.keys(userData).length > 0 && {
          user: { update: userData },
        }),
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    try {
      await this.studentsDao.deleteById(id);
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
