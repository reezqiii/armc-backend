import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PortalDepartment } from "./entities/portal_department.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalDepartmentService {
  constructor(
    @InjectRepository(PortalDepartment)
    private readonly departmentRepository: Repository<PortalDepartment>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.departmentRepository
      .createQueryBuilder("dept")
      .where("dept.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      name_of_department: "dept.name_of_department",
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
    return this.departmentRepository.find({
      where: { is_active: 1 },
      order: { name_of_department: "ASC" },
    });
  }

  async findOne(id: number) {
    const dept = await this.departmentRepository.findOne({
      where: { id_department: id, is_active: 1 },
    });
    if (!dept) throw new NotFoundException("Department not found");
    return dept;
  }

  async create(data: any, userId?: number) {
    const isExist = await this.departmentRepository.findOne({
      where: {
        name_of_department: data.name_of_department,
        is_active: 1,
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Department '${data.name_of_department}' already exists.`,
      );
    }

    const dept = this.departmentRepository.create({
      name_of_department: data.name_of_department,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.departmentRepository.save(dept);
  }

  async update(id: number, data: any, userId?: number) {
    const dept = await this.findOne(id);

    const isExist = await this.departmentRepository.findOne({
      where: {
        name_of_department: data.name_of_department,
        is_active: 1,
      },
    });

    if (isExist && isExist.id_department !== id) {
      throw new ConflictException(
        `Department name '${data.name_of_department}' is already used.`,
      );
    }

    dept.name_of_department = data.name_of_department;
    dept.updated_by = userId ?? null;
    return this.departmentRepository.save(dept);
  }

  async remove(id: number, userId?: number) {
    const dept = await this.findOne(id);
    dept.is_active = 0;
    dept.deleted_by = userId ?? null;
    return this.departmentRepository.save(dept);
  }
}
