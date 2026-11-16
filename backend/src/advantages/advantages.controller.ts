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
import { CreateAdvantageDto } from "./dto/create-advantage.dto";
import { UpdateAdvantageDto } from "./dto/update-advantage.dto";
import { AdvantagesService } from "./advantages.service";

@Controller("advantages")
export class AdvantagesController {
  constructor(private readonly advantagesService: AdvantagesService) {}

  @Get()
  findAvailable() {
    return this.advantagesService.findAvailable();
  }

  @Get("mine")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.advantagesService.findForPartner(user.profileId);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdvantageDto,
  ) {
    return this.advantagesService.create(user.profileId, dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAdvantageDto,
  ) {
    return this.advantagesService.update(id, user.profileId, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PARTNER_COMPANY")
  deactivate(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.advantagesService.deactivate(id, user.profileId);
  }
}
