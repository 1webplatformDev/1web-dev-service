import { Module } from "@nestjs/common";
import { FileService } from "./file.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
