import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PortalAppPermissionService } from './app_permission.service';
import { PortalAppPermission } from './app_permission.entity';


@Controller('portal-app-permission')
export class PortalAppPermissionController {
  constructor(private readonly service: PortalAppPermissionService) {}

  @Get()
  findAll(): Promise<PortalAppPermission[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<PortalAppPermission | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<PortalAppPermission>): Promise<PortalAppPermission> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<PortalAppPermission>): Promise<PortalAppPermission> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.service.remove(id);
  }
}
