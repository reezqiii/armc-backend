import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PortalProjectService } from './portal_project.service';
import { CreatePortalProjectDto } from './dto/create-portal_project.dto';
import { UpdatePortalProjectDto } from './dto/update-portal_project.dto';

@Controller('portal-project')
export class PortalProjectController {
  constructor(private readonly portalProjectService: PortalProjectService) {}

  @Post()
  create(@Body() createPortalProjectDto: CreatePortalProjectDto) {
    return this.portalProjectService.create(createPortalProjectDto);
  }

  @Get()
  findAll() {
    return this.portalProjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portalProjectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortalProjectDto: UpdatePortalProjectDto) {
    return this.portalProjectService.update(+id, updatePortalProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portalProjectService.remove(+id);
  }
}
