import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partnerCompaniesService.findOne(id, user.id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePartnerCompanyDto,
  ) {
    return this.partnerCompaniesService.update(id, user.id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partnerCompaniesService.remove(id, user.id);
  }
}
