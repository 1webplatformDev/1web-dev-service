import { ApiProperty } from "@nestjs/swagger";

export class SqlGeneratorCheckArrayInterface {
  @ApiProperty()
  tableFK?: string;
  aiName: string;
}
