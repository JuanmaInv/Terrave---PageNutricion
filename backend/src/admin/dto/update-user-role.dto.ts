import { IsIn } from "class-validator";

export class UpdateUserRoleDto {
  @IsIn(["admin", "cliente"])
  role!: "admin" | "cliente";
}
