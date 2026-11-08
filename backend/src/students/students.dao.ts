import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

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
export class StudentsDao {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.StudentCreateInput) {
    return this.prisma.student.create({
      data,
      select: studentSelection,
    });
  }

  findAll() {
    return this.prisma.student.findMany({
      select: studentSelection,
      orderBy: { name: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      select: studentSelection,
    });
  }

  update(id: string, data: Prisma.StudentUpdateInput) {
    return this.prisma.student.update({
      where: { id },
      data,
      select: studentSelection,
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const student = await transaction.student.findUniqueOrThrow({
        where: { id },
        select: { userId: true },
      });
      await transaction.user.delete({ where: { id: student.userId } });
    });
  }
}
