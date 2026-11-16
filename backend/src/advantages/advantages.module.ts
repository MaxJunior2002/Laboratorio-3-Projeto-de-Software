import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdvantagesController } from "./advantages.controller";
import { AdvantagesService } from "./advantages.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdvantagesController],
  providers: [AdvantagesService],
})
export class AdvantagesModule {}
