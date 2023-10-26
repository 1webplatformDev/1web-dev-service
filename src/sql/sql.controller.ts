import { Controller } from "@nestjs/common";
import { SqlService } from "./sql.service";

@Controller("sql")
export class SqlController {
  constructor(private readonly sqlService: SqlService) {}
}
