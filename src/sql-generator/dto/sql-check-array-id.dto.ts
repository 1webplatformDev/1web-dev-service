import { ApiProperty } from "@nestjs/swagger";

export class SqlCheckArrayIdDto {
  @ApiProperty()
  tableName: string;

  @ApiProperty()
  schemaName: string;

  @ApiProperty()
  aiName: string;

  @ApiProperty()
  aiType: string;

  @ApiProperty()
  errorText: string;
}
