// role_permission/role_permission.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
  ) {}

  // Get semua permission + tandai mana yang sudah di-assign ke role
  async getPermissionsByRole(id_role: number) {
    const role = await this._role.findOne({ where: { id_role } });
    if (!role) throw new NotFoundException("Role not found");

    const allPermissions = await this._permission.find();
    const assigned = await this._rolePermission.find({
      where: { role: { id_role } },
      relations: ["permission"],
    });

    const assignedIds = assigned.map((rp) => rp.permission.id_permission);

    return allPermissions.map((p) => ({
      ...p,
      assigned: assignedIds.includes(p.id_permission),
    }));
  }

  // Assign permission ke role (replace semua)
  async syncPermissions(id_role: number, permission_ids: number[]) {
    const role = await this._role.findOne({ where: { id_role } });
    if (!role) throw new NotFoundException("Role not found");

    // Hapus semua permission lama
    await this._rolePermission.delete({ role: { id_role } });

    // Insert permission baru
    if (permission_ids.length > 0) {
      const permissions = await this._permission.findByIds(permission_ids);
      const newEntries = permissions.map((p) =>
        this._rolePermission.create({ role, permission: p }),
      );
      await this._rolePermission.save(newEntries);
    }

    return { success: true, message: "Permissions updated" };
  }

  // Get semua permission (untuk dropdown/checklist)
  async getAllPermissions() {
    return this._permission.find({ order: { index_key: "ASC" } });
  }
}