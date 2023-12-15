import { ApiProperty } from "@nestjs/swagger";
import { SqlGeneratorErrorInterface } from "./sql-generator-error.interface";
import { SqlGeneratorFkInterface } from "./sql-generator-fk.interface";
import { SqlGeneratorCheckArrayInterface } from "./sql-generator-check-array.interface";

export class SqlGeneratorTableColumnInterface {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  notNull?: boolean;

  @ApiProperty()
  default?: string | boolean | number;

  @ApiProperty()
  comment?: string;

  @ApiProperty()
  ai?: boolean;

  @ApiProperty()
  ignoreFilter?: boolean;

  @ApiProperty()
  ui?: boolean;

  @ApiProperty()
  uiError?: SqlGeneratorErrorInterface;

  @ApiProperty()
  FK?: SqlGeneratorFkInterface;

  @ApiProperty()
  error404?: SqlGeneratorErrorInterface;
  @ApiProperty()
  checkArray?: SqlGeneratorCheckArrayInterface;
}
