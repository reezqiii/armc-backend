import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository, DataSource } from "typeorm";
import { PortalRole } from "./entities/portal_role_db.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { RolePermission } from "role_has_permission/entities/role_has_permission.entity";

@Injectable()
export class PortalRoleDbService {
  constructor(
    @InjectRepository(PortalRole)
    private readonly roleRepository: Repository<PortalRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.roleRepository
      .createQueryBuilder("role")
      .where("role.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      role_name: "role.role_name",
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

  async create(data: any, userId?: number) {
    const { role_name, permission_ids } = data;

    const isExist = await this.roleRepository.findOne({
      where: { role_name, is_active: 1 },
    });

    if (isExist)
      throw new ConflictException(`Role '${role_name}' already exists.`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newRole = queryRunner.manager.create(PortalRole, {
        role_name,
        is_active: 1,
        created_by: userId ?? null,
      });
      const savedRole = await queryRunner.manager.save(newRole);

      if (
        permission_ids &&
        Array.isArray(permission_ids) &&
        permission_ids.length > 0
      ) {
        const rolePermissions = permission_ids.map((id_permission) => ({
          id_role: savedRole.id_role,
          id_permission,
          created_by: userId ?? null,
        }));
        await queryRunner.manager.insert(RolePermission, rolePermissions);
      }

      await queryRunner.commitTransaction();
      return savedRole;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Failed to create role and permissions",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, data: any, userId?: number) {
    const { role_name, permission_ids } = data;

    await this.findOne(id);

    const isExist = await this.roleRepository.findOne({
      where: { role_name, is_active: 1, id_role: Not(id) },
    });

    if (isExist)
      throw new ConflictException(`Role name '${role_name}' is already used.`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(PortalRole, id, {
        role_name,
        updated_by: userId ?? null,
      });

      if (permission_ids && Array.isArray(permission_ids)) {
        await queryRunner.manager.delete(RolePermission, { id_role: id });

        if (permission_ids.length > 0) {
          const rolePermissions = permission_ids.map((id_permission) => ({
            id_role: id,
            id_permission,
            created_by: userId ?? null,
          }));
          await queryRunner.manager.insert(RolePermission, rolePermissions);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        "Failed to update role and permissions",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findOneWithPermissions(id: number) {
    const role = await this.findOne(id);
    const permissions = await this.rolePermissionRepo.find({
      where: { id_role: id },
      select: ["id_permission"],
    });

    return {
      ...role,
      permission_ids: permissions.map((p) => Number(p.id_permission)),
    };
  }

  async findAll() {
    return this.roleRepository.find({
      where: { is_active: 1 },
      order: { role_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id_role: id, is_active: 1 },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async remove(id: number, userId?: number) {
    const role = await this.findOne(id);
    role.is_active = 0;
    role.deleted_by = userId ?? null;
    return this.roleRepository.save(role);
  }
}
