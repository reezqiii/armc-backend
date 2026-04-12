import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { PortalUserPermission } from "./user_permission.entity";
import { PortalPermission } from "../portal_permission/permission.entity";

@Injectable()
export class PortalUserPermissionService {
  constructor(
    @InjectRepository(PortalUserPermission)
    private userPermRepo: Repository<PortalUserPermission>,
    @InjectRepository(PortalPermission)
    private permissionRepo: Repository<PortalPermission>,
  ) {}

  async getUserPermissionsForApp(userId: number, appId: number) {
    const rows = await this.userPermRepo.find({
      select: ["permission_key"],
      where: {
        id_user: userId,
      },
    });

    return rows.map((r) => r.permission_key);
  }

  async syncUserPermissions(
    userId: number,
    permissionIds: number[],
    createdBy?: number,
  ) {
    const uid = Number(userId);
    if (!uid || isNaN(uid)) throw new BadRequestException(`Invalid userId`);

    await this.userPermRepo.delete({ id_user: uid });

    if (!permissionIds || permissionIds.length === 0) return { count: 0 };

    const permissions = await this.permissionRepo.find({
      where: { id_permission: In(permissionIds) },
    });

    const toInsert = permissions.map((p) =>
      this.userPermRepo.create({
        id_user: uid,
        id_portal_permission: String(p.id_permission),
        permission_key: p.permission_key,
        create_by: createdBy ?? null,
        create_date: new Date(),
      }),
    );

    await this.userPermRepo.save(toInsert);
    return { message: "Synced", count: toInsert.length };
  }

  findAll() {
    return this.userPermRepo.find();
  }

  findOne(id: number) {
    return this.userPermRepo.findOne({ where: { id } });
  }

  create(data: Partial<PortalUserPermission>) {
    const newData = this.userPermRepo.create(data);
    return this.userPermRepo.save(newData);
  }

  async update(id: number, data: Partial<PortalUserPermission>) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("User permission not found");
    await this.userPermRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("User permission not found");
    return this.userPermRepo.delete(id);
  }

  async getUserPermissionList(userId: number) {
    const uid = Number(userId);
    if (!uid || isNaN(uid)) {
      throw new BadRequestException(
        `Invalid userId: "${userId}". Pastikan menggunakan integer ID user, bukan badge_no atau field lain.`,
      );
    }

    const allPermissions = await this.permissionRepo.find({
      where: { is_active: 1 },
      order: { permission_group: "ASC", permission_name: "ASC" },
    });

    const assignedRows = await this.userPermRepo.find({
      where: { id_user: uid },
    });

    const assignedKeys = new Set(
      assignedRows.map((r) => r.id_portal_permission),
    );

    return allPermissions.map((p) => ({
      id_permission: p.id_permission,
      permission_name: p.permission_name,
      permission_group: p.permission_group ?? "General",
      permission_key: p.permission_key,
      assigned: assignedKeys.has(String(p.id_permission)),
    }));
  }
}
