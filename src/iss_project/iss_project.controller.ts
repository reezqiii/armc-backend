import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { IssProjectService } from './iss_project.service';
import { IssProject } from './iss_project.entity';
import { Public } from 'auth/public.decorator';

@Controller('iss_project')
export class IssProjectController {
  constructor(private readonly projectService: IssProjectService) { }

  @Public()
  @Get()
  async getAll(): Promise<IssProject[]> {
    return this.projectService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<IssProject> {
    return this.projectService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<IssProject>): Promise<IssProject> {
    return this.projectService.create(data);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<IssProject>): Promise<IssProject> {
    return this.projectService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectService.remove(id);
  }
}
