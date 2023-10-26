import { Module } from "@nestjs/common";
import { SqlGeneratorService } from "./sql-generator.service";
import { SqlGeneratorController } from "./sql-generator.controller";

@Module({
  controllers: [SqlGeneratorController],
  providers: [SqlGeneratorService],
})
export class SqlGeneratorModule {}
