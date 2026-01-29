import { PartialType } from '@nestjs/swagger';
import { CreatePortalDepartmentDto } from './create-portal_department.dto';

export class UpdatePortalDepartmentDto extends PartialType(CreatePortalDepartmentDto) {}
