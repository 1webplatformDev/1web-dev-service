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
    const filesAdd: { [key: string]: boolean } = {};
    const result: string[] = [];

    const generatorSql = (paths: string[]) => {
      for (const path of paths) {
        // файл уже был скопирован
        if (filesAdd[path]) {
          continue;
        }

        const content = this.fileService.getFileContent(path);
        const reg = new RegExp("references [\\w.]*", "gi");
        const arrayFK = content.match(reg);

        // зависимостей у таблицы нет
        if (arrayFK == null) {
          filesAdd[path] = true;
          result.push(content);
          continue;
        }

        for (const elem of arrayFK) {
          const keyFileAdd = `${catalog}/${elem
            .slice(11) // убрать строку references
            .replaceAll(".", "/")}.sql`; // заменить . на / пример public.text на public/text - что бы добрать до файла

          // файл уже был скопирован
          if (filesAdd[keyFileAdd]) {
            continue;
          }

          generatorSql([keyFileAdd]);
        }
        filesAdd[path] = true;
        result.push(content);
      }
    };
    const pathArrayIndex = paths.filter(
      (path: string) => path.indexOf("index.sql") != -1,
    );
    generatorSql(pathArrayIndex); // прогнать вначале файлы генерации схем
    generatorSql(paths); // прогнать все остальное
    return this.fileService.createFileGetStream(
      "generator_sql.sql",
      result.join("\n"),
    );
  }
}
