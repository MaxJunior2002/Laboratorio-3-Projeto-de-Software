import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";
import { SemesterCreditScheduler } from "./semester-credit.scheduler";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, SemesterCreditScheduler],
  exports: [AuthGuard, AuthService, RolesGuard],
})
export class AuthModule {}
