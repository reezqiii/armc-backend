import { IsString } from "class-validator";

export class CreatePortalDepartmentDto {
  @IsString()
  name_of_department: string;
}
