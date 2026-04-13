import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PortalProject } from "./entities/portal_project.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalProjectService {
  constructor(
    @InjectRepository(PortalProject)
    private readonly projectRepository: Repository<PortalProject>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.projectRepository
      .createQueryBuilder("project")
      .where("project.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      project_name: "project.project_name",
    };

    if (sort) {
      const [col, dir] = sort.split(",");
      const column = columnMap[col];
      if (column) qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
    }

    if (search) {
      const searchObj = JSON.parse(search);
      Object.keys(searchObj).forEach((key) => {
        const column = columnMap[key];
        if (!column) return;
        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${searchObj[key]}%`,
        });
      });
    }

    const [data, total] = await qb.skip(skip).take(take).getManyAndCount();
    return {
      data,
      total,
      page,
      limit: take,
      total_pages: Math.ceil(total / take),
    };
  }

  async findAll() {
    return this.projectRepository.find({
      where: { is_active: 1 },
      order: { project_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id_project: id, is_active: 1 },
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async create(data: any, userId?: number) {
    const isExist = await this.projectRepository.findOne({
      where: {
        project_name: data.project_name,
        is_active: 1,
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Project '${data.project_name}' already exists.`,
      );
    }

    const project = this.projectRepository.create({
      project_name: data.project_name,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.projectRepository.save(project);
  }

  async update(id: number, data: any, userId?: number) {
    const project = await this.findOne(id);

    const isExist = await this.projectRepository.findOne({
      where: {
        project_name: data.project_name,
        is_active: 1,
      },
    });

    if (isExist && isExist.id_project !== id) {
      throw new ConflictException(
        `Project name '${data.project_name}' is already used by another project.`,
      );
    }

    project.project_name = data.project_name;
    project.updated_by = userId ?? null;
    return this.projectRepository.save(project);
  }

  async remove(id: number, userId?: number) {
    const project = await this.findOne(id);
    project.is_active = 0;
    project.deleted_by = userId ?? null;
    return this.projectRepository.save(project);
  }
}
