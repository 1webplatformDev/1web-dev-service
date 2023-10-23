import { Controller, Get, Header, Res, StreamableFile } from '@nestjs/common';
import { FileService } from './file.service';
import type { Response } from 'express';
 

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }
  @Get()
  @Header('Content-Type', 'application/sql')
  @Header('Content-Disposition', 'attachment; filename="test.sql"')
  getFile(@Res({ passthrough: true }) res: Response): StreamableFile {
    const name = "test2.sql";
    const file = this.fileService.createFile(name, "select * from test");
    return file;
  }
}
