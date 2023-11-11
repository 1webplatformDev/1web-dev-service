import { Module } from "@nestjs/common";
import { SqlGeneratorService } from "./sql-generator.service";
import { SqlGeneratorController } from "./sql-generator.controller";
import { FileModule } from "../file/file.module";
import { SqlModule } from "../sql/sql.module";

@Module({
  imports: [FileModule, SqlModule],
  controllers: [SqlGeneratorController],
  providers: [SqlGeneratorService],
})
export class SqlGeneratorModule {}
