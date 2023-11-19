import { Body, Controller, Post, Query } from "@nestjs/common";
import { SqlService } from "./sql.service";
import { ApiTags } from "@nestjs/swagger";
import { FunctionInDto } from "./dto/functionIn.dto";

@Controller("sql")
@ApiTags("sql")
export class SqlController {
  constructor(private readonly sqlService: SqlService) {}

  @Post("function/in")
  public async getFunctionIn(
    @Body() functionInDto: FunctionInDto,
    @Query("entity") entity: string,
  ) {
    const result = await this.sqlService.functionInParams(
      functionInDto.schema,
      entity,
    );
    return result.rows;
  }
}
