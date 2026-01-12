import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PortalPermissionService } from './permission.service';

@Controller('portal-permission')
export class PortalPermissionController {
  constructor(private readonly service: PortalPermissionService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

//   @Get(':id')
//   getOne(@Param('id') id: number) {
//     return this.service.findOne(id);
//   }

//   @Post()
//   create(@Body() body: any) {
//     return this.service.create(body);
//   }

//   @Put(':id')
//   update(@Param('id') id: number, @Body() body: any) {
//     return this.service.update(id, body);
//   }

//   @Delete(':id')
//   delete(@Param('id') id: number) {
//     return this.service.delete(id);
//   }
}
