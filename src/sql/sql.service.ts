import { Injectable } from "@nestjs/common";
import { InjectConnection } from "nest-postgres";
import { Client } from "pg";
import { FunctionRunDto } from "./dto/function-run.dto";

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
   * @param sort
   */
  public selectTable(schema: string, table: string, sort?: string) {
    let sql = `select * from ${schema}.${table}`;
    if (sort) {
      sql += ` order by ${sort}`;
    }
    return this.dbConnection.query(sql);
  }

  public functionInParams(schema: string[], entity: string) {
    const params = this.generatorParams({ schema_: schema, entity_: entity });
    return this.selectFunction("tec", "get_fun_in_params_comment", params);
  }

  public selectFunction(schema: string, funName: string, params?: string) {
    console.log(`select * from ${schema}.${funName}(${params})`);
    return this.dbConnection.query(
      `select * from ${schema}.${funName}(${params})`,
    );
  }

  private generatorParams(params: { [key: string]: any }) {
    const result = [];
    for (const key in params) {
      switch (typeof params[key]) {
        case "string":
          result.push(`${key} => '${params[key]}'`);
          break;
        case "number":
          result.push(`${key} => ${params[key]}`);
          break;
        case "object":
          if (Array.isArray(params[key])) {
            if (typeof params[key][0] != "object") {
              result.push(`${key} => '{${params[key].join()}}'`);
            } else if (typeof params[key][0] == "object") {
              const value = JSON.stringify(params[key])
                .slice(1, -1)
                .replace("},", "}','");
              result.push(`${key} => ARRAY['${value}']::json[]`);
            }
          }
          break;
        default:
          result.push(`${key} => ${params[key]}`);
      }
    }
    return result.join(",");
  }

  public async functionRun(functionRunDto: FunctionRunDto) {
    const params = this.generatorParams(functionRunDto.params);
    return this.selectFunction(
      functionRunDto.schema,
      functionRunDto.name,
      params,
    );
  }
}
