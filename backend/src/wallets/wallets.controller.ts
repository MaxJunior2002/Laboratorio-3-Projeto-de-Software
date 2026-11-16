import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { WalletsService } from "./wallets.service";

@Controller("wallet")
@UseGuards(AuthGuard, RolesGuard)
@Roles("STUDENT", "PROFESSOR")
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  getStatement(@CurrentUser() user: AuthenticatedUser) {
    return this.walletsService.getStatement(user.id);
  }
}
