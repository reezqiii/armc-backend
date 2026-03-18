import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { PortalProjectService } from './portal_project.service';

@Controller('portal-project')
export class PortalProjectController {
  constructor(private readonly portalProjectService: PortalProjectService) {}

  @Post('serverside_list')
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.portalProjectService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.portalProjectService.create(body, req.user?.id_user);
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
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.portalProjectService.update(+id, body, req.user?.id_user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.portalProjectService.remove(+id, req.user?.id_user);
  }
}