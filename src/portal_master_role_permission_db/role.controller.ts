import { Controller, Get } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';

@Controller('portal_master_role_permission_db')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async getAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }
}
