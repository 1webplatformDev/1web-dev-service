import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorFkInterface {
  @ApiProperty()
  table: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  funCheck: boolean;
}
