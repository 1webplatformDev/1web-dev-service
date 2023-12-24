import { Body, Controller, Post } from "@nestjs/common";
import { SqlService } from "./sql.service";
import { ApiTags } from "@nestjs/swagger";
import { FunctionInDto } from "./dto/functionIn.dto";
import { FunctionRunDto } from "./dto/function-run.dto";

@Controller("sql")
@ApiTags("sql")
export class SqlController {
  constructor(private readonly sqlService: SqlService) {}

  @Post("function/in")
  public async getFunctionIn(@Body() functionInDto: FunctionInDto) {
    const result = await this.sqlService.functionInParams(
      functionInDto.schema,
      functionInDto.entity,
    );
    return result.rows;
  }
  @Post("function/run")
  public async getFunctionRun(@Body() functionRunDto: FunctionRunDto) {
    const result = await this.sqlService.functionRun(functionRunDto);
    return result.rows;
  }
}
