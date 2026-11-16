import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ProfessorsService } from "./professors.service";

@Controller("professors")
@UseGuards(AuthGuard, RolesGuard)
@Roles("PROFESSOR")
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Post("transfers")
  transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransferDto,
  ) {
    return this.professorsService.transferCoins(user.id, dto);
  }
}
