import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FileModule } from "./file/file.module";
import { MainModule } from "./main/main.module";
import { SqlModule } from "./sql/sql.module";
import { SqlGeneratorModule } from "./sql-generator/sql-generator.module";
import { PostgresModule } from "nest-postgres";

@Module({
  imports: [
    PostgresModule.forRootAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connectionString: configService.get<string>("DB_CONNECTION_MAIN"),
        }),
      },
      "bdMain",
    ),
    ConfigModule.forRoot({ isGlobal: true }),
    FileModule,
    MainModule,
    SqlModule,
    SqlGeneratorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
