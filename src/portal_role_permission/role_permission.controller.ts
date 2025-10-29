import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { RolePermission } from './role_permission.entity';

@Controller('portal_role_permission')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get()
  getAll(): Promise<RolePermission[]> {
    return this.rolePermissionService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: number): Promise<RolePermission> {
    return this.rolePermissionService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<RolePermission>): Promise<RolePermission> {
    return this.rolePermissionService.create(data);
  }
}
