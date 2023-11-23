import { ApiProperty } from "@nestjs/swagger";
import { SqlGeneratorFunctionCheckArrayIdInterface } from "./sql-generator-function-check-array-id.interface";

export class SqlGeneratorFunctionInterface {
  @ApiProperty()
  check_ui: boolean;
  @ApiProperty()
  check_id: boolean;
  @ApiProperty()
  insert: boolean;
  @ApiProperty()
  filter: boolean;
  @ApiProperty()
  updated: boolean;
  @ApiProperty()
  check_array_id: SqlGeneratorFunctionCheckArrayIdInterface;
}
