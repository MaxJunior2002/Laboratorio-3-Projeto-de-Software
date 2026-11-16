import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RedemptionsController } from "./redemptions.controller";
import { RedemptionsService } from "./redemptions.service";

@Module({
  imports: [AuthModule, NotificationsModule, PrismaModule],
  controllers: [RedemptionsController],
  providers: [RedemptionsService],
})
export class RedemptionsModule {}
