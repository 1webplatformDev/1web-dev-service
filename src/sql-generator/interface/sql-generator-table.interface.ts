import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorTableInterface {
  @ApiProperty()
  name: string;
  @ApiProperty()
  comment: string;
}
