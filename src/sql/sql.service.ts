import { Injectable } from "@nestjs/common";
import { InjectConnection } from "nest-postgres";
import { Client } from "pg";

@Injectable()
export class SqlService {
  constructor(
    @InjectConnection("bdMain")
    private dbConnection: Client,
  ) {}

  /**
   * функция возвращающая все данные с таблички
   * @param schema
   * @param table
   */
  public selectTable(schema: string, table: string) {
    return this.dbConnection.query(`select * from ${schema}.${table}`);
  }

  public functionInParams(schema: string[], entity: string) {
    const schemaString: string = schema.map((elem) => `'${elem}'`).join();
    const params: string = `schema_ => array[${schemaString}], entity_ => '${entity}'`;
    return this.selectFunction("tec", "get_fun_in_params", params);
  }

  public selectFunction(schema: string, funName: string, params?: string) {
    return this.dbConnection.query(
      `select * from ${schema}.${funName}(${params})`,
    );
  }
}
