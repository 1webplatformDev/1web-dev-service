import { Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";

@Injectable()
export class SqlGeneratorService {
  public generatorTable(schema: string, name: string, columnTable: string) {
    return `drop table if exists ${schema}.${name} cascade; \ncreate table ${schema}.${name} (${columnTable});`;
  }
  public generatorComment(
    type: string,
    schema: string,
    name: string,
    columnName: string,
    comment: string,
  ) {
    return `comment on ${type} ${schema}.${name}.${columnName} is (${comment});`;
  }
  public generatorFunction(
    schema: string,
    name: string,
    params: string,
    code: string,
  ) {
    return `drop function if exists ${schema}.${name};
create or replace function ${schema}.${name}(\n${params}\n)
\tlanguage plpgsql
\tas $function$
\tbegin
\t\t${code}
\tend;
\t$function$;`;
  }

  public generatorSql(body: SqlGeneratorDto) {
    return body;
  }
}
