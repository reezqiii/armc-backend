import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
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
      where: { is_active: 1 },
      order: { permission_name: "ASC" },
    });
  }

  async findAllGrouped() {
    const permissions = await this.permissionRepo.find({
      where: { is_active: 1 },
      order: { permission_group: "ASC", permission_name: "ASC" },
    });

    const grouped = permissions.reduce(
      (acc, curr) => {
        const groupName = curr.permission_group || "Uncategorized";
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(curr);
        return acc;
      },
      {} as Record<string, PortalPermission[]>,
    );

    return grouped;
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: { id_permission: id },
    });
    if (!permission) throw new NotFoundException("Permission not found");
    return permission;
  }

  async create(data: Partial<PortalPermission>, userId?: number) {
    const isExist = await this.permissionRepo.findOne({
      where: { permission_name: data.permission_name, is_active: 1 },
    });

    if (isExist) {
      throw new ConflictException(
        `Permission with name "${data.permission_name}" already exists.`,
      );
    }

    const newData = this.permissionRepo.create({
      ...data,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.permissionRepo.save(newData);
  }

  async update(id: number, data: Partial<PortalPermission>, userId?: number) {
    await this.findOne(id);

    if (data.permission_name) {
      const isExist = await this.permissionRepo.findOne({
        where: { permission_name: data.permission_name, is_active: 1 },
      });

      if (isExist && isExist.id_permission !== id) {
        throw new ConflictException(`Permission name is already in use.`);
      }
    }

    await this.permissionRepo.update(id, {
      ...data,
      updated_by: userId ?? null,
    });
    return this.findOne(id);
  }

  async delete(id: number, userId?: number) {
    const find = await this.findOne(id);
    find.is_active = 0;
    find.deleted_by = userId ?? null;
    return this.permissionRepo.save(find);
  }

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.permissionRepo
        .createQueryBuilder("permission")
        .where("permission.is_active = :active", { active: 1 });

      const columnMap: Record<string, string> = {
        id_permission: "permission.id_permission",
        permission_name: "permission.permission_name",
        permission_group: "permission.permission_group",
      };

      if (search) {
        try {
          const searchObj = JSON.parse(search);
          for (const [key, value] of Object.entries(searchObj)) {
            if (value === undefined || value === null || value === "") continue;

            const column = columnMap[key];
            if (column) {
              qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
                [key]: `%${value}%`,
              });
            }
          }
        } catch (e) {}
      }

      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col];
        if (column) qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      } else {
        qb.orderBy("permission.id_permission", "DESC");
      }

      const [data, totalCount] = await qb
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return {
        data,
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / take),
        page,
        size: take,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
