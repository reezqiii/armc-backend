import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, DataSource } from "typeorm";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { PortalPermission } from "portal_permission/permission.entity";
import { RolePermission } from "./entities/role_has_permission.entity";

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly _rolePermission: Repository<RolePermission>,
    @InjectRepository(PortalRole)
    private readonly _role: Repository<PortalRole>,
    @InjectRepository(PortalPermission)
    private readonly _permission: Repository<PortalPermission>,
    private readonly dataSource: DataSource,
  ) {}

  async getPermissionsByRole(id_role: number) {
    const role = await this._role.findOne({ where: { id_role } });
    if (!role) throw new NotFoundException("Role not found");

    const allPermissions = await this._permission.find();

    const assigned = await this._rolePermission.find({
      where: { id_role: id_role },
      select: ["id_permission"],
    });

    const assignedIds = assigned.map((rp) => Number(rp.id_permission));

    return allPermissions.map((p) => ({
      ...p,
      assigned: assignedIds.includes(Number(p.id_permission)),
    }));
  }

  async syncPermissions(
    id_role: number,
    permission_ids: number[],
    userId?: number,
  ) {
    const role = await this._role.findOne({ where: { id_role } });
    if (!role) throw new NotFoundException("Role not found");

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(RolePermission, { id_role: id_role });

      if (permission_ids && permission_ids.length > 0) {
        const newEntries = permission_ids.map((pId) => ({
          id_role: id_role,
          id_permission: pId,
          created_by: userId ?? null,
        }));
        await queryRunner.manager.insert(RolePermission, newEntries);
      }

      await queryRunner.commitTransaction();
      return {
        success: true,
        message: "Role permissions updated successfully",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException("Failed to sync permissions");
    } finally {
      await queryRunner.release();
    }
  }

  async getAllPermissions() {
    return this._permission.find({
      order: { id_permission: "ASC" },
    });
  }
}
