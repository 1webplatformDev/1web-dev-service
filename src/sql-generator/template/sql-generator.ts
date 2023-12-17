export function templateFunctionCheckId(
  fromText: string,
  aiColumnName: string,
) {
  return `
\t\tselect * into result_ from public.create_error_ids(null, 200);
\t\tselect count(*) into check_rows from ${fromText}_get_filter(_${aiColumnName} => _id);
\t\tif check_rows = 0 then
\t\t\tselect * into result_ from public.create_error_ids(array[error_id], 404);
\t\tend if;`;
}

export function templateFunctionFilter(
  schema: string,
  table: string,
  ai: string,
  where: string,
) {
  return `
\t\treturn query select * from ${schema}.${table} ${ai}
\t\t\twhere ${where}
\t\t\tlimit _limit offset _offset;`;
}

export function templateParamsFunctionIdAndError() {
  return `\tin _id int4,\n\tout result_ json`;
}

export function templateFunction(
  schema: string,
  name: string,
  params: string,
  code: string,
  declare: string,
  returns: string = "void",
) {
  return `drop function if exists ${schema}.${name};
create or replace function ${schema}.${name}(\n${params}\n)
\treturns ${returns}
\tlanguage plpgsql
\tas $function$
\tdeclare ${declare ? declare : ""}
\tbegin ${code}
\tend;
$function$;`;
}

export function templateComment(
  type: string,
  schema: string,
  name: string,
  columnName: string = null,
  comment: string,
) {
  if (columnName) {
    return `comment on ${type} ${schema}.${name}.${columnName} is '${comment}';`;
  }
  return `comment on ${type} ${schema}.${name} is '${comment}';`;
}

export function templateTable(
  schema: string,
  name: string,
  columnTable: string,
) {
  return `drop table if exists ${schema}.${name} cascade;\ncreate table ${schema}.${name} (\n\t${columnTable}\n);`;
}

export function templateDeclareCheckId(id: number) {
  return `\n\t\tcheck_rows int;\n\t\terror_id int = ${id};`;
}

export function templateReturnFilter(name: string) {
  return `setof ${name}`;
}

export function templateFunctionUI(code: string) {
  return `
${code}
\t\tif array_length(error_array, 1) <> 0 then
\t\t\tselect * into errors_ from public.create_error_ids(error_array, 400);
\t\t\treturn;
\t\tend if;

\t\tselect * into errors_ from public.create_error_json(null, 200);`;
}

export function templateFunctionUIItem(
  functions: string,
  column: string,
  aiColumnName: string,
) {
  return `
\t\tselect count(*) into count_${column} 
\t\tfrom ${functions}_get_filter(_${column} => _${column}, _no_${aiColumnName} => _${aiColumnName});
\n\t\tif count_${column} <> 0 then
\t\t\terror_array = array_append(error_array, error_id_${column});
\t\tend if;\n`;
}

export function templateFunctionRunCheckId(
  nameFun: string,
  nameParams: string,
) {
  return `select * into result_ from ${nameFun}_check_id(_id => _${nameParams});
${templateCheckStatus("404")}`;
}

export function templateFunctionInsert(
  name: string,
  column: string,
  values: string,
) {
  return `\n\t\tinsert into ${name} (${column}) \n\t\tvalues (${values})\n\t\treturning id into id_;`;
}

export function templateFunctionRunCheckUI(name: string, column: string) {
  return `select * into result_ from ${name}_check_unique(${column});`;
}
export function templateCheckStatus(code: string) {
  return `\t\tif (result_::json->'status_result')::text::int = ${code} then
\t\t\treturn;
\t\tend if;`;
}

export function templateCommentFunction(
  schemaName: string,
  funName: string,
  params: string,
) {
  return `-- select * from ${schemaName}.${funName}(${params})`;
}
export function templateCheckArrayIdFunction(
  aiName: string,
  aliasTable: string,
  schemaAndTableName: string,
) {
  return `\n\t\tselect array_agg(${aliasTable}.${aiName}) into _result_ids from ${schemaAndTableName} ${aliasTable} where ${aliasTable}.${aiName} = any(ids_);
\t\tselect array(select unnest(ids_) except select unnest(_result_ids)) into error_ids;
\t\tif array_length(error_ids, 1) <> 0 then
\t\t\tselect json_build_object('name', replace(error_text_, '{1}', array_to_string(error_ids, ','))) into _result;
\t\t\treturn;
\t\tend if;
\t\t_result = null;`;
}

export function templateRunCheckArrayIdFunction(
  table: string,
  nameColumn: string,
) {
  return `\n\t\tselect _result_ids, _result into _${nameColumn}, error_text
\t\tfrom ${table}_check_array_id(_${nameColumn});
\t\tif error_text is not null then
\t\t\terrors_text = array_append(errors_text, error_text);
\t\tend if;\n`;
}
export function templateDeclareCheckArrayId() {
  return "\n\t\terrors_text json[];\n\t\terror_text json;";
}
export function templateCheckErrorTextInCheckArrayId() {
  return `\n\t\tif array_length(errors_text, 1) <> 0 then
\t\t\tselect * into result_ from create_result_json(_warning => errors_text);
\t\tend if;\n`;
}
