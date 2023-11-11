import { Injectable } from "@nestjs/common";
import { InjectConnection } from "nest-postgres";
import { Client } from "pg";

@Injectable()
export class SqlService {
  constructor(
    @InjectConnection("bdMain")
    private dbConnection: Client,
  ) {}
  public selectTable(schema: string, table: string) {
    return this.dbConnection.query(`select * from ${schema}.${table}`);
  }
}
