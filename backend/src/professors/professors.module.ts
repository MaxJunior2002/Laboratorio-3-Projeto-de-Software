import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfessorsController } from "./professors.controller";
import { ProfessorsService } from "./professors.service";

@Module({
  imports: [AuthModule, NotificationsModule, PrismaModule],
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
})
export class ProfessorsModule {}
