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
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsService } from "./students.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth.types";

@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Get("directory")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("PROFESSOR")
  findDirectory(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findDirectory(user.id);
  }

  @Get(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("STUDENT", "PROFESSOR")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.findOne(id, user.id, user.role === "PROFESSOR");
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("STUDENT")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, user.id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("STUDENT")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.remove(id, user.id);
  }
}
