import { Module } from "@nestjs/common";
import { PartnerCompaniesController } from "./partner-companies.controller";
import { PartnerCompaniesDao } from "./partner-companies.dao";
import { PartnerCompaniesService } from "./partner-companies.service";

@Module({
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesDao, PartnerCompaniesService],
})
export class PartnerCompaniesModule {}
