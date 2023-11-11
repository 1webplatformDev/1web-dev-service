import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SqlGeneratorDto } from "./dto/sql-generator.dto";
import { SqlGeneratorTableColumnInterface } from "./interface/sql-generator-table-column.interface";
import { SqlGeneratorTableInterface } from "./interface/sql-generator-table.interface";
import {
  templateCheckStatus,
  templateComment,
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

@Injectable()
export class SqlGeneratorService {
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
  public generatorFunctionCheckId(body: SqlGeneratorDto) {
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

  /**
   * Создать функцию filter
   * @param body
   */
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
      templateReturnFilter(this.getSchemaAndTableName(body)),
    );
  }

  /**
   * получить алис имени таблицы
   */
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

  /**
   * Создать функцию CheckUI проверка унилькальности
   * @param body
   */
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

  /**
   * Создать вызов функции checkId по зависимостям FK
   * @param body
   * @param checkAddAI
   */
  public generatorRunCheckId(body: SqlGeneratorDto, checkAddAI: boolean) {
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

  public generatorRunCheckUI(body: SqlGeneratorDto, checkAddAI: boolean) {
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
  public generatorInsert(body: SqlGeneratorDto) {
    const result: string[] = [];
    result.push(this.generatorRunCheckId(body, false));
    const insertInfo: string[] = [];
    const insertValues: string[] = [];
    for (const column of body.table.column) {
      if (column.ai) {
        continue;
      }
      insertValues.push(column.name);
      insertInfo.push(`_${column.name}`);
    }
    const code: string[] = [];
    code.push(`\n\t\t${result.join("")}\n`);
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
      `${this.generatorInParams(body)}\n\tout id_ int,\n\tout result_ json`,
      code.join(""),
      "",
    );
  }
  /**
   * Создать функции updated
   * @param body
   */
  public generatorUpdated(body: SqlGeneratorDto) {
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
    code.push("\n\t\tupdate constructor.type_css_var");
    code.push(`\n\t\tset ${updateCode.join(", ")}`);
    code.push(`\n\t\twhere ${ai.name} = _${ai.name};`);
    return templateFunction(
      body.schema.name,
      `${body.table.name}_updated`,
      `${this.generatorInParams(body)}\n\tout result_ json`,
      code.join(""),
      "",
    );
  }

  /**
   * создание всех шаблонных функциях
   * @param body
   */
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
  public generatorInParams(body: SqlGeneratorDto) {
    const result: string[] = [];
    for (const column of body.table.column) {
      if (column.ai) {
        continue;
      }

      result.push(`in _${column.name} ${column.type}`);

      if (column.default) {
        result[result.length - 1] += ` = ${column.default}`;
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
          this.getSchemaAndTableName(body),
        );
        result.push(res);
      }
    }
    return result;
  }

  /**
   * Создание sql кода insert overriding
   */
  public generatorInsertOverriding(
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
    return `insert into ${tableName}(${columnString})\noverriding system value values(${valuesString})`;
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
    result.push("\n\n");
    result.push(this.generatorInsertError(body).join("\n\n"));
    return result.join("");
  }
}
