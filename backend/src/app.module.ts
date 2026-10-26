import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { InstitutionsModule } from "./institutions/institutions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StudentsModule } from "./students/students.module";
import { PartnerCompaniesModule } from "./partner-companies/partner-companies.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "public"),
      exclude: ["/api{*path}"],
    }),
    PrismaModule,
    InstitutionsModule,
    StudentsModule,
    PartnerCompaniesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
