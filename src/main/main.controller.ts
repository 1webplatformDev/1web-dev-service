import { Body, Controller, Get, Header, Post } from "@nestjs/common";
import { MainService } from "./main.service";
import { ReportPlanTextInterface } from "./interface/reportPlanText.interface";
import { ReportPlanTextDto } from "./dto/reportPlanText.dto";

@Controller("main")
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @Post("reportPlanText")
  reportPlanText(@Body() body: ReportPlanTextDto): ReportPlanTextInterface {
    return this.mainService.reportPlanText(body.content);
  }
  @Get("generatorSql")
  @Header("Content-Type", "application/sql")
  @Header("Content-Disposition", 'attachment; filename="all.sql"')
  generatorSql() {
    return this.mainService.joinRepositoryFile();
  }
}
