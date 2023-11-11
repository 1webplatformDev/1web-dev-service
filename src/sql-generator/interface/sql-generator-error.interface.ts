import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorErrorInterface {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  id_project: number;

  @ApiProperty()
  status: number;
}
