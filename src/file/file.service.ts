import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReadStream, createReadStream, writeFileSync } from "fs";

@Injectable()
export class FileService {

    constructor(private configService: ConfigService) { }

    createFile(name: string, content: string): StreamableFile {
        const catalog = this.configService.get<string>('TEMP_CATALOG');
        const pathFile = `${catalog}${name}`;
        writeFileSync(pathFile, content);
        const file = createReadStream(pathFile);
        return new StreamableFile(file);
    }
}