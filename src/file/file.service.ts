import { Injectable, StreamableFile } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createReadStream,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from "fs";

@Injectable()
export class FileService {
  constructor(private configService: ConfigService) {}

  private getPathFile(name: string) {
    const catalog = this.configService.get<string>("TEMP_CATALOG");
    return `${catalog}${name}`;
  }
  createFileGetStream(name: string, content: string): StreamableFile {
    const pathFile = this.getPathFile(name);
    this.createFile(pathFile, content);
    const file = createReadStream(pathFile);
    return new StreamableFile(file);
  }
  getFileContent(path: string) {
    return readFileSync(path, { encoding: "utf8" });
  }

  createFile(pathFile: string, content: string) {
    writeFileSync(pathFile, content, { encoding: "utf-8" });
  }

  getPathFilesRecursion(dir: string, files_params = [], type?: string) {
    let file: string[] = files_params;
    const files = readdirSync(dir);
    for (const item in files) {
      const name = dir + "/" + files[item];

      if (statSync(name).isDirectory()) {
        file = this.getPathFilesRecursion(name, file, type);
        continue;
      }

      if (!type) {
        file.push(name);
        continue;
      }

      if (name.slice(name.lastIndexOf(".") + 1, name.length) == type) {
        file.push(name);
      }
    }
    return file;
  }
}
