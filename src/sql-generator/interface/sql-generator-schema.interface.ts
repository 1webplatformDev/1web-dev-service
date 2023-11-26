import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorSchemaInterface {
  @ApiProperty({ default: false })
  new?: boolean;
  @ApiProperty()
  name: string;
}
