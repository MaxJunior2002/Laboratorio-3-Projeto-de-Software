import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { compare } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedUser } from "./auth.types";

const SESSION_LENGTH_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        student: { select: { id: true, name: true } },
        professor: { select: { id: true, name: true } },
        partnerCompany: { select: { id: true, name: true } },
      },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    const profile = user.student
      ? { role: "STUDENT" as const, profile: user.student }
      : user.professor
        ? { role: "PROFESSOR" as const, profile: user.professor }
        : user.partnerCompany
          ? { role: "PARTNER_COMPANY" as const, profile: user.partnerCompany }
          : null;
    if (!profile) {
      throw new UnauthorizedException("Conta sem perfil ativo.");
    }
    if (profile.role === "PROFESSOR") {
      await this.grantSemesterCredit(user.id);
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_LENGTH_DAYS);
    await this.prisma.userSession.create({
      data: {
        tokenHash: this.hashToken(token),
        userId: user.id,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        profileId: profile.profile.id,
        name: profile.profile.name,
      },
    };
  }

  async logout(sessionId: string) {
    await this.prisma.userSession.delete({ where: { id: sessionId } });
    return { message: "Sessão encerrada." };
  }

  async grantSemesterCredit(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException("Carteira do professor não encontrada.");
    }

    const semesterKey = this.getSemesterKey(new Date());
    await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.transaction.createMany({
        data: {
          type: "SEMESTER_CREDIT",
          amount: 1000,
          reason: `Crédito do semestre ${semesterKey}`,
          semesterKey,
          walletId: wallet.id,
        },
        skipDuplicates: true,
      });
      if (created.count === 1) {
        await transaction.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: 1000 } },
        });
      }
    });
  }

  async grantCurrentSemesterCredits() {
    const professors = await this.prisma.professor.findMany({
      select: { userId: true },
    });
    for (const professor of professors) {
      await this.grantSemesterCredit(professor.userId);
    }
  }

  private getSemesterKey(date: Date) {
    return `${date.getFullYear()}-S${date.getMonth() < 6 ? "1" : "2"}`;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
