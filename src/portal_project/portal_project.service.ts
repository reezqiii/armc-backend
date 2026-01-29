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

  // CREATE
  create(createPortalProjectDto: CreatePortalProjectDto) {
    const project = this.projectRepository.create(createPortalProjectDto);
    return this.projectRepository.save(project);
  }

  // READ ALL (untuk Select / List)
  async findAll() {
    return this.projectRepository.find({
      select: ["id", "project_code", "project_name"],
      order: { project_name: "ASC" },
    });
  }

  // READ ONE
  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  // UPDATE
  async update(id: number, updatePortalProjectDto: UpdatePortalProjectDto) {
    const result = await this.projectRepository.update(
      { id },
      updatePortalProjectDto,
    );

    if (result.affected === 0) {
      throw new NotFoundException("Project not found");
    }

    return {
      message: "Project updated successfully",
    };
  }

  // DELETE
  async remove(id: number) {
    const result = await this.projectRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException("Project not found");
    }

    return {
      message: "Project deleted successfully",
    };
  }
}
