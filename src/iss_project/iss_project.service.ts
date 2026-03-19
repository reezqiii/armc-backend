import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssProject } from './iss_project.entity';

@Injectable()
export class IssProjectService {
  constructor(
    @InjectRepository(IssProject)
    private readonly projectRepo: Repository<IssProject>,
  ) { }

  async findAll(): Promise<IssProject[]> {
    return await this.projectRepo.find({
      order: { project_desc: 'ASC' } 
    });
  }

  async findOne(id: number): Promise<IssProject> {
    const project = await this.projectRepo.findOne({ where: { project_id: id } });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async create(data: Partial<IssProject>): Promise<IssProject> {
    const project = this.projectRepo.create(data);
    return await this.projectRepo.save(project);
  }

  async update(id: number, data: Partial<IssProject>): Promise<IssProject> {
    const project = await this.findOne(id);
    Object.assign(project, data);
    return await this.projectRepo.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }
}
