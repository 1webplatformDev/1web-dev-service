import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FileModule } from "./file/file.module";
import { MainModule } from "./main/main.module";

@Module({
  imports: [ConfigModule.forRoot(), FileModule, MainModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
