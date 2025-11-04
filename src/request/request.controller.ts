import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestEntity } from './request.entity';

@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  async create(@Body() data: Partial<RequestEntity>): Promise<RequestEntity> {
    return this.requestService.create(data);
  }

  @Get()
  async findAll(): Promise<RequestEntity[]> {
    return this.requestService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<RequestEntity> {
    return this.requestService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ deleted: boolean }> {
    return this.requestService.remove(id);
  }
}
