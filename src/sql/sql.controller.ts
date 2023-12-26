import { Body, Controller, Post } from "@nestjs/common";
import { SqlService } from "./sql.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FunctionRunDto } from "./dto/function-run.dto";

@Controller("sql")
@ApiTags("sql")
export class SqlController {
  constructor(private readonly sqlService: SqlService) {}
  @Post("function/run")
  @ApiOperation({
    summary: "Вызов хранимой функции",
  })
  public async getFunctionRun(@Body() functionRunDto: FunctionRunDto) {
    const result = await this.sqlService.functionRun(functionRunDto);
    return result.rows;
  }
}
