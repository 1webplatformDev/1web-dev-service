import { Injectable } from "@nestjs/common";
import { ReportPlanTextInterface } from "./interface/reportPlanText.interface";
import { ConfigService } from "@nestjs/config";
import { FileService } from "../file/file.service";

@Injectable()
export class MainService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
  ) {}
  public reportPlanText(body: string): ReportPlanTextInterface {
    const reg = new RegExp("CMS-(\\d)*", "gi");
    const textTitle = " Доработка П2";
    const result: ReportPlanTextInterface = { body: null, title: null };

    const arrayCmsId = body.match(reg);
    result.title = arrayCmsId.join(", ");
    result.title += textTitle;
    result.body = body;
    this.joinRepositoryFile();
    return result;
  }

  public joinRepositoryFile() {
    const catalog: string = this.configService.get("CATALOG_SQL_REPOSITORY");
    const paths = this.fileService.getPathFilesRecursion(catalog, [], "sql");
    const filesAdd: any = {};
    const result: string[] = [];

    const generatorSql = (paths: string[]) => {
      for (const path of paths) {
        if (filesAdd[path]) {
          continue;
        }
        const content = this.fileService.getFileContent(path);
        const reg = new RegExp("references [\\w.]*", "gi");
        const arrayFK = content.match(reg);
        if (arrayFK == null) {
          filesAdd[path] = true;
          result.push(content);
          continue;
        }
        for (const elem of arrayFK) {
          const keyFileAdd = `${catalog}/${elem
            .slice(11)
            .replaceAll(".", "/")}.sql`;
          if (filesAdd[keyFileAdd]) {
            continue;
          }
          generatorSql([keyFileAdd]);
        }
      }
    };
    generatorSql(paths);
    return this.fileService.createFile("generator_sql.sql", result.join("\n"));
  }
}
