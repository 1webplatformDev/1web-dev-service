import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { SqlGeneratorTableColumnInterface } from "./interface/sql-generator-table-column.interface";
import { SqlGeneratorTableInterface } from "./interface/sql-generator-table.interface";
import {
  templateComment,
  templateDeclareCheckId,
  templateFunction,
  templateFunctionCheckId,
  templateFunctionFilter,
  templateFunctionUI,
  templateFunctionUIItem,
  templateParamsFunctionIdAndError,
  templateReturnFilter,
  templateTable,
} from "./template/sql-generator";

@Injectable()
export class SqlGeneratorService {
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
      templateComment("table", schema, table.name, null, table.comment),
    );
    result.push(""); // перенос строки из за join("\n");
    for (const column of table.column) {
      result.push(
        templateComment(
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

  private aiColumnGet(columns: SqlGeneratorTableColumnInterface[]) {
    return columns.filter(
      (column: SqlGeneratorTableColumnInterface) => column.ai,
    )[0];
  }
  public generatorFunctionCheckId(body: SqlGeneratorDto) {
    const aiColumn = this.aiColumnGet(body.table.column);

    const code = templateFunctionCheckId(
      `${body.schema.name}.${body.table.name}`,
      aiColumn.name,
    );
    return templateFunction(
      body.schema.name,
      `${body.table.name}_check_id`,
      templateParamsFunctionIdAndError(),
      code,
      templateDeclareCheckId(aiColumn.error404.id),
      "json",
    );
  }
  public generatorFilterParameter(body: SqlGeneratorDto) {
    const getParameter = (
      name: string,
      type: string,
      aliasNameTable: string,
    ) => {
      return {
        paramsString: `_${name} ${type} = null`,
        whereString: `(${aliasNameTable}.${name} = ${name} or ${name} is null)`,
      };
    };
    const aliasNameTable = this.aliasNameTable(body.table.name);
    const where: string[] = [];
    const params: string[] = [];
    for (const column of body.table.column) {
      if (column.ignoreFilter) {
        continue;
      }

      if (column.ai) {
        const { paramsString, whereString } = getParameter(
          `no_${column.name}`,
          column.type,
          aliasNameTable,
        );
        params.push(paramsString);
        where.push(whereString);
      }
      const { paramsString, whereString } = getParameter(
        column.name,
        column.type,
        aliasNameTable,
      );
      params.push(paramsString);
      where.push(whereString);
    }
    params.push("_limit int = null");
    params.push("_offset int = null");
    return { where, params };
  }

  public generatorFunctionFilter(body: SqlGeneratorDto) {
    const { params, where } = this.generatorFilterParameter(body);
    return templateFunction(
      body.schema.name,
      `${body.table.name}_get_filter`,
      `\t${params.join(",\n\t")}`,
      templateFunctionFilter(
        body.schema.name,
        body.table.name,
        this.aliasNameTable(body.table.name),
        where.join("\n\t\t\t\tand"),
      ),
      null,
      templateReturnFilter(`${body.schema.name}.${body.table.name}`),
    );
  }

  public aliasNameTable(name: string) {
    const result = [];
    let index = -1;
    for (const char of name) {
      index++;
      if (char == "_") {
        result.push(name[index + 1]);
      }
    }
    return result.join("");
  }

  public generatorCheckUI(body: SqlGeneratorDto) {
    const aiColumn = this.aiColumnGet(body.table.column);
    const code: string[] = [];
    const declareValue: string[] = [];
    const declareValueErrors: string[] = [];
    const params: string[] = [];
    for (const column of body.table.column) {
      if (column.ui) {
        params.push(`in _${column.name} ${column.type}`);
        declareValue.push(`count_${column.name}`);
        declareValueErrors.push(
          `error_id_${column.name} int = ${column.uiError.id}`,
        );
        code.push(
          templateFunctionUIItem(
            `${body.schema.name}.${body.table.name}`,
            column.name,
            aiColumn.name,
          ),
        );
      }
    }
    if (code.length) {
      params.push(`in _${aiColumn.name} ${aiColumn.type} = null`);
      params.push("out errors_ json");
      const declareAll = [
        ...declareValue,
        ...declareValueErrors,
        "error_array int[];",
      ];
      return templateFunction(
        body.schema.name,
        `${body.table.name}_check_ui`,
        `\t${params.join(",\n\t")}`,
        templateFunctionUI(code.join("")),
        `\n\t\t${declareAll.join(";\n\t\t")}`,
      );
    }
    throw new HttpException(
      "обязательные поля не были найдены уберите флаг check_ui",
      HttpStatus.BAD_REQUEST,
    );
  }

  public generatorTempFunction(body: SqlGeneratorDto) {
    const result = [];
    if (body.function.filter) {
      result.push(this.generatorFunctionFilter(body));
    }

    if (body.function.check_id) {
      result.push(this.generatorFunctionCheckId(body));
    }

    if (body.function.check_ui) {
      result.push(this.generatorCheckUI(body));
    }
    return result;
  }

  public generatorSql(body: SqlGeneratorDto) {
    const result = [];
    const { resultUi, resultCol } = this.generatorColumn(
      body.schema.name,
      body.table.name,
      body.table.column,
    );
    const table = templateTable(
      body.schema.name,
      body.table.name,
      resultCol.join("\n\t"),
    );
    const commentTable = this.generatorTableCommit(
      body.schema.name,
      body.table,
    );
    result.push(table + "\n\n");

    if (resultUi.length) {
      result.push(resultUi.join("\n") + "\n\n");
    }

    result.push(commentTable + "\n\n");
    result.push(this.generatorTempFunction(body).join("\n\n"));
    return result.join("");
  }
}
