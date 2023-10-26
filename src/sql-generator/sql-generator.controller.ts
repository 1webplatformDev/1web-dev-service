import { Body, Controller, Post } from "@nestjs/common";
import { SqlGeneratorService } from "./sql-generator.service";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";

@Controller("sql-generator")
export class SqlGeneratorController {
  constructor(private readonly sqlGeneratorService: SqlGeneratorService) {}

  @Post("")
  public generatorTable(@Body() body: SqlGeneratorDto) {
    return this.sqlGeneratorService.generatorSql(body);
  }
}
