import { Controller, Get, Header, StreamableFile } from "@nestjs/common";
import { FileService } from "./file.service";

@Controller("file")
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Get()
  @Header("Content-Type", "application/sql")
  @Header("Content-Disposition", 'attachment; filename="test.sql"')
  getFile(): StreamableFile {
    const name = "test2.sql";
    return this.fileService.createFile(name, "select * from test");
  }
}
