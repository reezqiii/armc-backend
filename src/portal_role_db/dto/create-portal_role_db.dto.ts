import { IsString } from "class-validator";

export class CreatePortalRoleDbDto {
  @IsString()
  role_name: string;
}