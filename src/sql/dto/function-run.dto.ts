import { ApiProperty } from "@nestjs/swagger";

export class FunctionRunDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  schema: string;
  @ApiProperty()
  params: { [key: string]: any };
}
