import { Module } from "@nestjs/common";
import { PartnerCompaniesController } from "./partner-companies.controller";
import { PartnerCompaniesService } from "./partner-companies.service";

@Module({
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesService],
})
export class PartnerCompaniesModule {}
