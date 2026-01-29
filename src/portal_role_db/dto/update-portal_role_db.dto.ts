import { PartialType } from '@nestjs/swagger';
import { CreatePortalRoleDbDto } from './create-portal_role_db.dto';

export class UpdatePortalRoleDbDto extends PartialType(CreatePortalRoleDbDto) {}
