import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PortalPermission } from "./permission.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalPermissionService {
  constructor(
    @InjectRepository(PortalPermission)
    private readonly permissionRepo: Repository<PortalPermission>,
  ) {}

  findAll() {
    return this.permissionRepo.find({
      where: { is_active: 1 }, // ← hanya active
      order: { permission_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: { id_permission: id },
    });
    if (!permission) throw new NotFoundException("Permission not found");
    return permission;
  }

  async create(data: Partial<PortalPermission>, userId?: number) {
    const newData = this.permissionRepo.create({
      ...data,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.permissionRepo.save(newData);
  }

  async update(id: number, data: Partial<PortalPermission>, userId?: number) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("Permission not found");
    await this.permissionRepo.update(id, {
      ...data,
      updated_by: userId ?? null,
    });
    return this.findOne(id);
  }

  async delete(id: number, userId?: number) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("Permission not found");
    find.is_active = 0;
    find.deleted_by = userId ?? null;
    return this.permissionRepo.save(find);
  }

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.permissionRepo
      .createQueryBuilder("permission")
      .where("permission.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      permission_name: "permission.permission_name",
      index_key: "permission.index_key",
      permission_group: "permission.permission_group",
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
}
