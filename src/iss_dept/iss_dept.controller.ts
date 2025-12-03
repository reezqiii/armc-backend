import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { IssDeptService } from './iss_dept.service';
import { IssDept } from './iss_dept.entity';
import { Public } from 'auth/public.decorator';

@Controller('iss_dept')
export class IssDeptController {
  constructor(private readonly deptService: IssDeptService) { }

  // @Get()
  // async getAll(): Promise<IssDept[]> {
  //   return this.deptService.findAll();
  // }

  @Public()
  @Get()
  async getAll(): Promise<IssDept[]> {
    return this.deptService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<IssDept> {
    return this.deptService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<IssDept>): Promise<IssDept> {
    return this.deptService.create(data);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<IssDept>): Promise<IssDept> {
    return this.deptService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deptService.remove(id);
  }
}
