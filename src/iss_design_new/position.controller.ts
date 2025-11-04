import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { PositionService } from './position.service';
import { Position } from './position.entity';

@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get()
  async findAll(): Promise<Position[]> {
    return this.positionService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Position> {
    return this.positionService.findById(id);
  }

  @Post()
  async create(@Body() data: Partial<Position>): Promise<Position> {
    return this.positionService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Position>): Promise<Position> {
    return this.positionService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.positionService.delete(id);
  }
}
