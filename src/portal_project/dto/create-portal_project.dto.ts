import { IsString } from "class-validator";

export class CreatePortalProjectDto {
  @IsString()
  project_name: string;
}
