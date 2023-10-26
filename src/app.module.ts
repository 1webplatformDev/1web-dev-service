import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FileModule } from "./file/file.module";
import { MainModule } from "./main/main.module";
import { SqlModule } from "./sql/sql.module";
import { SqlGeneratorModule } from "./sql-generator/sql-generator.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    FileModule,
    MainModule,
    SqlModule,
    SqlGeneratorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
