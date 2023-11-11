import { Module } from "@nestjs/common";
import { SqlService } from "./sql.service";
import { SqlController } from "./sql.controller";

@Module({
  imports: [],
  controllers: [SqlController],
  providers: [SqlService],
  exports: [SqlService],
})
export class SqlModule {}
