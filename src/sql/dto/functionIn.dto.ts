import { ApiProperty } from "@nestjs/swagger";

export class FunctionInDto {
  @ApiProperty()
  schema: string[];
}
