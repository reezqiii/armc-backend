import { Controller, Get } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';

@Controller('portal_project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }
}
