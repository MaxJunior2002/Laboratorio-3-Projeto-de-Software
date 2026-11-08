import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { StudentsDao } from "./students.dao";
import { StudentsService } from "./students.service";

@Module({
  controllers: [StudentsController],
  providers: [StudentsDao, StudentsService],
})
export class StudentsModule {}
