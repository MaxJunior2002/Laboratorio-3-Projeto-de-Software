import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CreatePartnerCompanyDto } from "./dto/create-partner-company.dto";
import { UpdatePartnerCompanyDto } from "./dto/update-partner-company.dto";
import { PartnerCompaniesService } from "./partner-companies.service";

@Controller("partner-companies")
export class PartnerCompaniesController {
  constructor(
    private readonly partnerCompaniesService: PartnerCompaniesService,
  ) {}

  @Post()
  create(@Body() dto: CreatePartnerCompanyDto) {
    return this.partnerCompaniesService.create(dto);
  }

  @Get()
  findAll() {
    return this.partnerCompaniesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.partnerCompaniesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartnerCompanyDto,
  ) {
    return this.partnerCompaniesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.partnerCompaniesService.remove(id);
  }
}
