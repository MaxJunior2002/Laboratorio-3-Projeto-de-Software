import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PartnerCompaniesController } from "./partner-companies.controller";
import { PartnerCompaniesDao } from "./partner-companies.dao";
import { PartnerCompaniesService } from "./partner-companies.service";

@Module({
  imports: [AuthModule],
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesDao, PartnerCompaniesService],
})
export class PartnerCompaniesModule {}
