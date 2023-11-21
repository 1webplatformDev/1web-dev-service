import { ApiProperty } from "@nestjs/swagger";
import { SqlGeneratorSchemaInterface } from "../interface/sql-generator-schema.interface";
import { SqlGeneratorTableInterface } from "../interface/sql-generator-table.interface";
import { SqlGeneratorFunctionInterface } from "../interface/sql-generator-function.interface";

export class SqlGeneratorDto {
  @ApiProperty()
  schema: SqlGeneratorSchemaInterface;
  @ApiProperty()
  table: SqlGeneratorTableInterface;
  @ApiProperty()
  function: SqlGeneratorFunctionInterface;
  @ApiProperty()
  insertError: boolean;
}
