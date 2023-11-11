import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { SqlGeneratorService } from "./sql-generator.service";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { Response } from "express";
import { ApiOperation } from "@nestjs/swagger";

@Controller("sql-generator")
export class SqlGeneratorController {
  constructor(private readonly sqlGeneratorService: SqlGeneratorService) {}

  @Post("/json")
  @ApiOperation({
    summary: "Генерация sql файла базовая сущность на основе json",
  })
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

  @Get("/insert")
  @ApiOperation({
    summary: "Генерация sql файла базовая сущность на основе json",
  })
  public async generatorInsert(
    @Query("schema")
    schema: string,
    @Query("table")
    table: string,
    @Res() response: Response,
  ) {
    response.setHeader("Content-Type", "application/sql");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=insert-${schema}.${table}.sql`,
    );
    response.send(
      await this.sqlGeneratorService.generatorSqlInsertDataset(schema, table),
    );
  }
}
