import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PortalProject } from "./entities/portal_project.entity";
import { CreatePortalProjectDto } from "./dto/create-portal_project.dto";
import { UpdatePortalProjectDto } from "./dto/update-portal_project.dto";

@Injectable()
export class PortalProjectService {
  constructor(
    @InjectRepository(PortalProject)
    private readonly projectRepository: Repository<PortalProject>,
  ) {}

  create(createPortalProjectDto: CreatePortalProjectDto) {
    const project = this.projectRepository.create(createPortalProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll() {
    return this.projectRepository.find({
      order: { project_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id: id },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async update(id: number, updatePortalProjectDto: UpdatePortalProjectDto) {
    const result = await this.projectRepository.update(
      { id: id },
      updatePortalProjectDto,
    );
    if (result.affected === 0) throw new NotFoundException("Project not found");
    return { message: "Project updated successfully" };
  }

  async remove(id: number) {
    const result = await this.projectRepository.delete({ id: id });
    if (result.affected === 0) throw new NotFoundException("Project not found");
    return { message: "Project deleted successfully" };
  }
}
