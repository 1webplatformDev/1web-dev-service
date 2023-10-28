import { Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { SqlGeneratorTableColumnInterface } from "./interface/sql-generator-table-column.interface";

@Injectable()
export class SqlGeneratorService {
  public generatorTable(schema: string, name: string, columnTable: string) {
    return `drop table if exists ${schema}.${name} cascade; \ncreate table ${schema}.${name} (\n${columnTable}\n);`;
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

  private generatorColumn(columns: SqlGeneratorTableColumnInterface[]) {
    const result = [];
    for (const column of columns) {
      result.push(`${column.name} ${column.type}`);
      if (column.ai) {
        result[result.length - 1] += ` generated always as identity`;
      }

      if (column.notNull) {
        result[result.length - 1] += ` not null`;
      }

      if (column.default) {
        result[result.length - 1] += ` default ${column.default}`;
      }
      if (column.FK) {
        result[
          result.length - 1
        ] += ` REFERENCES ${column.FK.table} (${column.FK.key})`;
      }

      if (column.comment) {
        result[result.length - 1] += ` -- ${column.comment}`;
      }
    }
    return result;
  }

  public generatorSql(body: SqlGeneratorDto) {
    const result = [];
    const column = this.generatorColumn(body.table.column);
    result.push(
      this.generatorTable(
        body.schema.name,
        body.table.name,
        column.join("\n\t"),
      ),
    );
    return result.join();
  }
}
