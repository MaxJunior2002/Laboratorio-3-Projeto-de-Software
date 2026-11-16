import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { StudentsController } from "./students.controller";
import { StudentsDao } from "./students.dao";
import { StudentsService } from "./students.service";

@Module({
  imports: [AuthModule],
  controllers: [StudentsController],
  providers: [StudentsDao, StudentsService],
})
export class StudentsModule {}
