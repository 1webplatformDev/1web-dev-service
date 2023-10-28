import { Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { SqlGeneratorTableColumnInterface } from "./interface/sql-generator-table-column.interface";
import { SqlGeneratorTableInterface } from "./interface/sql-generator-table.interface";

@Injectable()
export class SqlGeneratorService {
  public generatorTable(schema: string, name: string, columnTable: string) {
    return `drop table if exists ${schema}.${name} cascade; \ncreate table ${schema}.${name} (\n\t${columnTable}\n);`;
  }
  public generatorComment(
    type: string,
    schema: string,
    name: string,
    columnName: string = null,
    comment: string,
  ) {
    if (columnName) {
      return `comment on ${type} ${schema}.${name}.${columnName} is (${comment});`;
    }
    return `comment on ${type} ${schema}.${name} is (${comment});`;
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

  private generatorColumn(
    schema: string,
    table: string,
    columns: SqlGeneratorTableColumnInterface[],
  ) {
    const resultCol: string[] = [];
    const resultUi: string[] = [];
    let primary = "";
    for (const column of columns) {
      resultCol.push(`${column.name} ${column.type}`);
      if (column.ui) {
        resultUi.push(
          `create unique index ${table}_${column.name}_idx on ${schema}.${table}  using btree (${column.name});`,
        );
      }
      if (column.ai) {
        resultCol[resultCol.length - 1] += ` generated always as identity`;
        primary = `constraint ${table}_pk primary key (${column.name})`;
      }

      if (column.notNull) {
        resultCol[resultCol.length - 1] += ` not null`;
      }

      if (column.default) {
        resultCol[resultCol.length - 1] += ` default ${column.default}`;
      }

      if (column.FK) {
        resultCol[
          resultCol.length - 1
        ] += ` REFERENCES ${column.FK.table} (${column.FK.key})`;
      }

      resultCol[resultCol.length - 1] += ",";

      if (column.comment) {
        resultCol[resultCol.length - 1] += ` -- ${column.comment}`;
      }
    }
    resultCol.push(primary);
    return { resultCol, resultUi };
  }

  private generatorTableCommit(
    schema: string,
    table: SqlGeneratorTableInterface,
  ) {
    const result = [];
    result.push(
      this.generatorComment("table", schema, table.name, null, table.comment),
    );
    result.push(""); // перенос строки из за join("\n");
    for (const column of table.column) {
      result.push(
        this.generatorComment(
          "column",
          schema,
          table.name,
          column.name,
          column.comment,
        ),
      );
    }
    return result.join("\n");
  }

  public generatorSql(body: SqlGeneratorDto) {
    const result = [];
    const { resultUi, resultCol } = this.generatorColumn(
      body.schema.name,
      body.table.name,
      body.table.column,
    );
    const table = this.generatorTable(
      body.schema.name,
      body.table.name,
      resultCol.join("\n\t"),
    );
    const commentTable = this.generatorTableCommit(
      body.schema.name,
      body.table,
    );
    result.push(table + "\n\n");
    result.push(resultUi.join("\n") + "\n\n");
    result.push(commentTable);
    return result.join("");
  }
}
