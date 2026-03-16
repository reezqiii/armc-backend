import { PartialType } from "@nestjs/swagger";
import { CreatePortalProjectDto } from "./create-portal_project.dto";

export class UpdatePortalProjectDto extends PartialType(
  CreatePortalProjectDto,
) {}
