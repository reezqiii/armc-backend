import { PartialType } from '@nestjs/swagger';
import { CreateRoleHasPermissionDto } from './create-role_has_permission.dto';

export class UpdateRoleHasPermissionDto extends PartialType(CreateRoleHasPermissionDto) {}
