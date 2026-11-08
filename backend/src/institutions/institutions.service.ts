import { Injectable } from "@nestjs/common";
import { InstitutionsDao } from "./institutions.dao";

@Injectable()
export class InstitutionsService {
  constructor(private readonly institutionsDao: InstitutionsDao) {}

  findAll() {
    return this.institutionsDao.findAll();
  }
}
