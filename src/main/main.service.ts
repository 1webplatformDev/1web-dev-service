import { Injectable } from "@nestjs/common";
import { ReportPlanTextInterface } from "./interface/reportPlanText.interface";

@Injectable()
export class MainService {
  reportPlanText(body: string): ReportPlanTextInterface {
    console.log(body);
    const reg = new RegExp("CMS-(\\d)*", "gi");
    const textTitle = " Доработка П2";
    const result: ReportPlanTextInterface = { body: null, title: null };

    const arrayCmsId = body.match(reg);
    result.title = arrayCmsId.join(", ");
    result.title += textTitle;
    result.body = body;
    return result;
  }
}
