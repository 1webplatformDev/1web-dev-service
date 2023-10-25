import { Body, Controller, Post } from "@nestjs/common";
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
}
