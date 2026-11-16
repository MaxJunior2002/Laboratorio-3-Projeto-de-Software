import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthenticatedUser;
      }>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) {
      throw new UnauthorizedException("Autenticação obrigatória.");
    }

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            student: { select: { id: true } },
            professor: { select: { id: true } },
            partnerCompany: { select: { id: true } },
            wallet: { select: { id: true } },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Sessão inválida ou expirada.");
    }
    if (session.expiresAt <= new Date()) {
      await this.prisma.userSession.delete({ where: { id: session.id } });
      throw new UnauthorizedException("Sessão inválida ou expirada.");
    }

    const { user } = session;
    const profile = user.student
      ? { role: "STUDENT" as const, profileId: user.student.id }
      : user.professor
        ? { role: "PROFESSOR" as const, profileId: user.professor.id }
        : user.partnerCompany
          ? {
              role: "PARTNER_COMPANY" as const,
              profileId: user.partnerCompany.id,
            }
          : null;

    if (!profile) {
      throw new UnauthorizedException("Conta sem perfil ativo.");
    }

    request.user = {
      id: user.id,
      email: user.email,
      ...profile,
      walletId: user.wallet?.id ?? null,
      sessionId: session.id,
    };
    return true;
  }
}
