import { IsString } from "class-validator";

export class CreatePortalDepartmentDto {
  @IsString()
  name_department: string;
}