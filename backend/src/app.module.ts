import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { InstitutionsModule } from "./institutions/institutions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StudentsModule } from "./students/students.module";
import { PartnerCompaniesModule } from "./partner-companies/partner-companies.module";
import { AuthModule } from "./auth/auth.module";
import { AdvantagesModule } from "./advantages/advantages.module";
import { ProfessorsModule } from "./professors/professors.module";
import { RedemptionsModule } from "./redemptions/redemptions.module";
import { WalletsModule } from "./wallets/wallets.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "public"),
      exclude: ["/api{*path}"],
    }),
    PrismaModule,
    AuthModule,
    InstitutionsModule,
    StudentsModule,
    PartnerCompaniesModule,
    AdvantagesModule,
    ProfessorsModule,
    RedemptionsModule,
    WalletsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
