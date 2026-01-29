import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PortalRoleDbService } from './portal_role_db.service';
import { CreatePortalRoleDbDto } from './dto/create-portal_role_db.dto';
import { UpdatePortalRoleDbDto } from './dto/update-portal_role_db.dto';

@Controller('role')
export class PortalRoleDbController {
  constructor(private readonly portalRoleDbService: PortalRoleDbService) {}

  @Post()
  create(@Body() createPortalRoleDbDto: CreatePortalRoleDbDto) {
    return this.portalRoleDbService.create(createPortalRoleDbDto);
  }

  @Get()
  findAll() {
    return this.portalRoleDbService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portalRoleDbService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortalRoleDbDto: UpdatePortalRoleDbDto) {
    return this.portalRoleDbService.update(+id, updatePortalRoleDbDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portalRoleDbService.remove(+id);
  }
}
