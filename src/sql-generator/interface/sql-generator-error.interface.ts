import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorErrorInterface {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  idProject: number;

  @ApiProperty()
  status: number;
}
