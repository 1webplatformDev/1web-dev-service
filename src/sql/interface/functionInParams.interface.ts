export interface FunctionInParamsInterface {
  schema_name: string;
  fun_name: string;
  params: {
    name: string;
    type: string;
  }[];
}
