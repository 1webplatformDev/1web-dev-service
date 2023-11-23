import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorFunctionCheckArrayIdInterface {
  @ApiProperty()
  check: boolean;
  @ApiProperty()
  text_error: string;
}
