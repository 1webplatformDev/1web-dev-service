import { Body, Controller, Post, Res } from "@nestjs/common";
import { SqlGeneratorService } from "./sql-generator.service";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { Response } from "express";
import { FileService } from "../file/file.service";

@Controller("sql-generator")
export class SqlGeneratorController {
  constructor(
    private readonly sqlGeneratorService: SqlGeneratorService,
    private readonly fileService: FileService,
  ) {}

  @Post("")
  public generatorTable(
    @Body() body: SqlGeneratorDto,
    @Res() response: Response,
  ) {
    const nameFile = `generator-${body.schema.name}.${body.table.name}.sql;`;
    response.setHeader("Content-Type", "application/sql");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${nameFile}`,
    );
    const string = this.sqlGeneratorService.generatorSql(body);
    response.send(string);
  }
}
