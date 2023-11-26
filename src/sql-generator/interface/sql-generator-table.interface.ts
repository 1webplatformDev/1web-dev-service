import { ApiProperty } from "@nestjs/swagger";
import { SqlGeneratorTableColumnInterface } from "./sql-generator-table-column.interface";

export class SqlGeneratorTableInterface {
  @ApiProperty()
  name: string;

  @ApiProperty()
  comment?: string;

  @ApiProperty({ isArray: true, type: SqlGeneratorTableColumnInterface })
  column: SqlGeneratorTableColumnInterface[];
}
