import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateRedemptionDto } from "./dto/create-redemption.dto";
import { RedemptionsService } from "./redemptions.service";

@Controller("redemptions")
@UseGuards(AuthGuard, RolesGuard)
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Post()
  @Roles("STUDENT")
  redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRedemptionDto,
  ) {
    return this.redemptionsService.redeem(user.id, dto);
  }

  @Post("verify/:code")
  @HttpCode(HttpStatus.OK)
  @Roles("PARTNER_COMPANY")
  verify(@CurrentUser() user: AuthenticatedUser, @Param("code") code: string) {
    return this.redemptionsService.verify(user.id, code);
  }
}
