import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { SqlGeneratorTableColumnInterface } from "./interface/sql-generator-table-column.interface";
import { SqlGeneratorTableInterface } from "./interface/sql-generator-table.interface";
import {
  templateCheckArrayIdFunction,
  templateCheckStatus,
  templateComment,
  templateCommentFunction,
  templateDeclareCheckId,
  templateFunction,
  templateFunctionCheckId,
  templateFunctionFilter,
  templateFunctionInsert,
  templateFunctionRunCheckId,
  templateFunctionRunCheckUI,
  templateFunctionUI,
  templateFunctionUIItem,
  templateParamsFunctionIdAndError,
  templateReturnFilter,
  templateTable,
} from "./template/sql-generator";
import { ObjectPrimitive, Primitive } from "../main/type/mainType";
import { SqlService } from "../sql/sql.service";
import { FunctionInParamsInterface } from "../sql/interface/functionInParams.interface";

@Injectable()
export class SqlGeneratorService {
  constructor(private readonly sqlService: SqlService) {}
  /**
   * генерация колонок
   */
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

  /**
   * Функция создать комментарии для таблицы
   * @param schema
   * @param table
   * @private
   */
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

  /**
   * Функция получить колонку первичного ключа
   * @param columns
   * @private
   */
  private aiColumnGet(columns: SqlGeneratorTableColumnInterface[]) {
    return columns.filter(
      (column: SqlGeneratorTableColumnInterface) => column.ai,
    )[0];
  }

  /**
   * Функция создает строку схема + таблица
   */
  private getSchemaAndTableName(body: SqlGeneratorDto) {
    return `${body.schema.name}.${body.table.name}`;
  }

  /**
   * Создание функции проверки по id
   * @param body
   */
  private generatorFunctionCheckId(body: SqlGeneratorDto) {
    const aiColumn = this.aiColumnGet(body.table.column);

    const code = templateFunctionCheckId(
      this.getSchemaAndTableName(body),
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

  /**
   * Вспомогательная функция для создания функции filter
   * создает входящие параметры для функции и where
   * @param body
   */
  private generatorFilterParameter(body: SqlGeneratorDto) {
    const getParameter = (
      name: string,
      type: string,
      aliasNameTable: string,
    ) => {
      return {
        paramsString: `_${name} ${type} = null`,
        whereString: `(${aliasNameTable}.${name} = _${name} or _${name} is null)`,
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
        const { paramsString } = getParameter(
          `no_${column.name}`,
          column.type,
          aliasNameTable,
        );
        params.push(paramsString);
        where.push(
          `(${aliasNameTable}.${column.name} <> _no_${column.name} or _no_${column.name} is null)`,
        );
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

  /**
   * Создать функцию filter
   * @param body
   */
  private generatorFunctionFilter(body: SqlGeneratorDto) {
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
      templateReturnFilter(this.getSchemaAndTableName(body)),
    );
  }

  /**
   * получить алис имени таблицы
   */
  private aliasNameTable(name: string) {
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

  /**
   * Создать функцию CheckUI проверка унилькальности
   * @param body
   */
  private generatorCheckUI(body: SqlGeneratorDto) {
    const aiColumn = this.aiColumnGet(body.table.column);
    const code: string[] = [];
    const declareValue: string[] = [];
    const declareValueErrors: string[] = [];
    const params: string[] = [];
    for (const column of body.table.column) {
      if (column.ui) {
        params.push(`in _${column.name} ${column.type}`);
        declareValue.push(`count_${column.name} int`);
        declareValueErrors.push(
          `error_id_${column.name} int = ${column.uiError.id}`,
        );
        code.push(
          templateFunctionUIItem(
            this.getSchemaAndTableName(body),
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
        `${body.table.name}_check_unique`,
        `\t${params.join(",\n\t")}`,
        templateFunctionUI(code.join("")),
        `\n\t\t${declareAll.join(";\n\t\t")}`,
        "json",
      );
    }
    throw new HttpException(
      "обязательные поля не были найдены уберите флаг check_ui",
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Создать вызов функции checkId по зависимостям FK
   * @param body
   * @param checkAddAI
   */
  private generatorRunCheckId(body: SqlGeneratorDto, checkAddAI: boolean) {
    const result: string[] = [];
    for (const column of body.table.column) {
      if (column.FK && column.FK.funCheck) {
        result.push(
          templateFunctionRunCheckId(`${column.FK.table}`, column.name),
        );
      }
    }
    if (checkAddAI) {
      const ai = this.aiColumnGet(body.table.column);
      result.push(
        templateFunctionRunCheckId(this.getSchemaAndTableName(body), ai.name),
      );
    }
    return result.join("\n\n\t\t");
  }

  private generatorRunCheckUI(body: SqlGeneratorDto, checkAddAI: boolean) {
    const columns: string[] = [];
    for (const column of body.table.column) {
      if (column.ui) {
        columns.push(`_${column.name} => _${column.name}`);
      }
    }
    if (checkAddAI) {
      const ai = this.aiColumnGet(body.table.column);
      columns.push(`_${ai.name} => _${ai.name}`);
    }
    const result: string[] = [];
    result.push("\n\t\t");
    result.push(
      templateFunctionRunCheckUI(
        this.getSchemaAndTableName(body),
        columns.join(", "),
      ),
    );
    result.push("\n" + templateCheckStatus("400") + "\n");
    return result.join("");
  }

  /**
   * Создать функции insert
   * @param body
   */
  private generatorInsert(body: SqlGeneratorDto) {
    const result: string[] = [];
    result.push(this.generatorRunCheckId(body, false));
    const insertInfo: string[] = [];
    const insertValues: string[] = [];
    for (const column of body.table.column) {
      if (column.ai) {
        continue;
      }
      insertValues.push(`_${column.name}`);
      insertInfo.push(column.name);
    }
    const code: string[] = [];
    code.push(`\t\t${result.join("")}\n`);
    code.push(this.generatorRunCheckUI(body, false));
    code.push(
      templateFunctionInsert(
        this.getSchemaAndTableName(body),
        insertInfo.join(", "),
        insertValues.join(", "),
      ),
    );
    return templateFunction(
      body.schema.name,
      `${body.table.name}_insert`,
      `${this.generatorInParams(body)},\n\tout id_ int,\n\tout result_ json`,
      `\n${code.join("")}`,
      "",
      "record",
    );
  }
  /**
   * Создать функции updated
   * @param body
   */
  private generatorUpdated(body: SqlGeneratorDto) {
    const ai = this.aiColumnGet(body.table.column);
    const result: string[] = [];
    result.push(this.generatorRunCheckId(body, true));
    const updateCode: string[] = [];
    for (const column of body.table.column) {
      if (column.ai) {
        continue;
      }
      updateCode.push(`${column.name} = _${column.name}`);
    }
    const code: string[] = [];
    code.push(`\n\t\t${result.join("")}\n`);
    code.push(this.generatorRunCheckUI(body, true));
    code.push(`
\t\tupdate ${this.getSchemaAndTableName(body)}`);
    code.push(`\n\t\tset ${updateCode.join(", ")}`);
    code.push(`\n\t\twhere ${ai.name} = _${ai.name};`);
    return templateFunction(
      body.schema.name,
      `${body.table.name}_updated`,
      `\tin _${ai.name} ${ai.type},\n${this.generatorInParams(
        body,
      )},\n\tout result_ json`,
      code.join(""),
      "",
      "json",
    );
  }
  /**
   * создание функции check_array_id
   * @param body
   */
  private generatorCheckArrayId(body: SqlGeneratorDto) {
    const ai = this.aiColumnGet(body.table.column);
    const aliasTable = this.aliasNameTable(body.table.name);
    const schemaAndTable = this.getSchemaAndTableName(body);
    const errorText = body.function.check_array_id.text_error;
    const declare = `\n\t\terror_text varchar = '${errorText}';\n\t\terror_ids int[];\n\t\twarning_json json[];`;
    const params = `\tids_ integer[],\n\tout _result_ids integer[],\n\tout _result json`;
    return templateFunction(
      body.schema.name,
      `${body.table.name}_check_array_id`,
      params,
      templateCheckArrayIdFunction(ai.name, aliasTable, schemaAndTable),
      declare,
      "record",
    );
  }

  /**
   * создание всех шаблонных функциях
   * @param body
   */
  private generatorTempFunction(body: SqlGeneratorDto) {
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

    if (body.function.check_array_id?.check) {
      result.push(this.generatorCheckArrayId(body));
    }

    if (body.function.insert) {
      result.push(this.generatorInsert(body));
    }
    if (body.function.updated) {
      result.push(this.generatorUpdated(body));
    }
    return result;
  }

  /**
   * функция генерирует входяшие параметры для функции создании и редактировании
   * @param body
   */
  private generatorInParams(body: SqlGeneratorDto) {
    const result: string[] = [];
    for (const column of body.table.column) {
      if (column.ai) {
        continue;
      }

      result.push(`in _${column.name} ${column.type}`);

      if (column.default) {
        result[result.length - 1] += ` = ${column.default}`;
      }
      if (column.notNull !== true && column.default == null) {
        result[result.length - 1] += ` = null`;
      }
    }
    return `\t${result.join(",\n\t")}`;
  }

  /**
   * Создание sql кода insert errors
   * @private
   */
  private generatorInsertError(body: SqlGeneratorDto) {
    const result: string[] = [];
    for (const columnElement of body.table.column) {
      let key: string = null;

      if (columnElement.uiError) {
        key = "uiError";
      }

      if (columnElement.error404) {
        key = "error404";
      }

      if (columnElement[key]) {
        const res = this.generatorInsertOverriding(
          columnElement[key] as unknown as ObjectPrimitive,
          "public.errors",
        );
        result.push(res);
      }
    }
    return result;
  }

  /**
   * Создание sql кода insert overriding
   */
  private generatorInsertOverriding(
    dataset: ObjectPrimitive,
    tableName: string,
  ) {
    const column: string[] = [];
    const values: Primitive[] = [];
    for (const key in dataset) {
      column.push(key);
      if (typeof dataset[key] == "string") {
        values.push(`'${dataset[key]}'`);
      } else if (dataset[key] == null) {
        values.push("null");
      } else {
        values.push(dataset[key]);
      }
    }
    const columnString = column.join(", ");
    const valuesString = values.join(", ");
    return `insert into ${tableName}(${columnString})\noverriding system value values(${valuesString});`;
  }
  /**
   * общая функция генерация sql по json
   * @param body
   */
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
    if (body.insertError != false) {
      result.push("\n\n-- в файл public/error.sql\n");
      result.push(this.generatorInsertError(body).join("\n\n"));
    }
    return result.join("");
  }

  public async generatorSqlInsertDataset(schema: string, table: string) {
    const result: string[] = [];
    const rows = await this.sqlService.selectTable(schema, table);
    for (const row of rows.rows) {
      result.push(this.generatorInsertOverriding(row, `${schema}.${table}`));
    }
    return result.join("\n\n");
  }

  public async generatorCommentBdSql(schema: string[], entity: string) {
    const result = await this.sqlService.functionInParams(schema, entity);
    const comment: string[] = [];
    for (const row of result.rows as FunctionInParamsInterface[]) {
      const params: string[] = [];
      for (const param of row.params) {
        params.push(`${param.name} => ${param.type}`);
      }
      comment.push(
        templateCommentFunction(
          row.schema_name,
          row.fun_name,
          params.join(", "),
        ),
      );
    }
    return comment;
  }
}
