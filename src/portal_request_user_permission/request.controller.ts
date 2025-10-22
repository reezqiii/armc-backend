import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { RequestEntity } from './request.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Controller('requests')
@ApiBearerAuth('access-token')
export class RequestController {
  constructor(private readonly requestService: RequestService) { }

  // GET all requests dengan server-side pagination
  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.requestService.findAll(); // Bisa diganti serverSideList jika queryDto dipakai
  }

  // GET single request
  @Get(':id')
  findOne(@Param('id') id: number): Promise<RequestEntity> {
    return this.requestService.findOne(id);
  }

  // POST create request
  @Post('/create')
  async create(@Body() data: Partial<RequestEntity>, @Req() req): Promise<RequestEntity> {
    return this.requestService.create(data);
  }

  // PUT update request
  @Put(':id')
  update(@Param('id') id_request: number, @Body() data: Partial<RequestEntity>): Promise<RequestEntity> {
    return this.requestService.update(id_request, data); // pastikan ada method update di service
  }

  // DELETE request
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.requestService.remove(id);
  }
  // POST server-side list
  @Post('/serverside_list')
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    return await this.requestService.serverSideList(queryDto);
  }
}
