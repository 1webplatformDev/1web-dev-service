import { ApiProperty } from "@nestjs/swagger";

export class ReportPlanTextDto {
  @ApiProperty()
  content: string;
}
