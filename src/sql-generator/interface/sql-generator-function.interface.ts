import { ApiProperty } from "@nestjs/swagger";

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
}
