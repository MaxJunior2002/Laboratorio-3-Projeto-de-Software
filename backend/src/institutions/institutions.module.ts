import { Module } from "@nestjs/common";
import { InstitutionsController } from "./institutions.controller";
import { InstitutionsDao } from "./institutions.dao";
import { InstitutionsService } from "./institutions.service";

@Module({
  controllers: [InstitutionsController],
  providers: [InstitutionsDao, InstitutionsService],
})
export class InstitutionsModule {}
