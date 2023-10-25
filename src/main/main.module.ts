import { Module } from "@nestjs/common";
import { MainService } from "./main.service";
import { MainController } from "./main.controller";
import { FileModule } from "../file/file.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule, FileModule],
  controllers: [MainController],
  providers: [MainService],
})
export class MainModule {}
