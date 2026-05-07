import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { DataSource } from "typeorm";
import { PortalUserPermission } from "./user_permission.entity";
import { PortalPermission } from "../portal_permission/permission.entity";
import { RolePermission } from "role_has_permission/entities/role_has_permission.entity";

@Injectable()
export class PortalUserPermissionService {
  constructor(
    @InjectRepository(PortalUserPermission)
    private userPermRepo: Repository<PortalUserPermission>,
    @InjectRepository(PortalPermission)
    private permissionRepo: Repository<PortalPermission>,
    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
    private dataSource: DataSource,
  ) {}

  async getPermissionIds(id_user: number, id_role: number): Promise<number[]> {
    const rolePermissions = await this.rolePermRepo.find({
      where: { id_role: id_role },
      select: ["id_permission"],
    });

    const userPermissions = await this.userPermRepo.find({
      where: { id_user },
      select: ["id_portal_permission"],
    });

    const rolePermIds = rolePermissions.map((rp) => Number(rp.id_permission));
    const userPermIds = userPermissions.map((up) =>
      Number(up.id_portal_permission),
    );

    return [...new Set([...rolePermIds, ...userPermIds])];
  }

  async getUserExtraPermissions(id_user: number): Promise<number[]> {
    const perms = await this.userPermRepo.find({
      where: { id_user },
      select: ["id_portal_permission"],
    });

    return perms.map((p) => Number(p.id_portal_permission));
  }

  async getUserPermissionList(userId: number) {
    const allPermissions = await this.permissionRepo.find({
      where: { is_active: 1 },
      order: { id_permission: "ASC" },
    });

    const userPerms = await this.userPermRepo.find({
      where: { id_user: userId },
      select: ["id_portal_permission"],
    });

    const assignedIds = new Set(
      userPerms.map((p) => Number(p.id_portal_permission)),
    );

    return allPermissions.map((p) => ({
      ...p,
      assigned: assignedIds.has(Number(p.id_permission)),
    }));
  }

  async syncUserPermissions(
    userId: number,
    permissionIds: number[],
    admin_id: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(PortalUserPermission, {
        id_user: userId,
      });

      if (permissionIds && permissionIds.length > 0) {
        const toInsert = permissionIds.map((pId) => ({
          id_user: userId,
          id_portal_permission: pId,
          created_by: admin_id,
        }));
        await queryRunner.manager.insert(PortalUserPermission, toInsert);
      }

      await queryRunner.commitTransaction();
      return { success: true, message: "Permissions synced successfully" };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException("Failed to sync user permissions");
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number) {
    const data = await this.userPermRepo.findOne({ where: { id } });
    if (!data) throw new NotFoundException("Permission record not found");
    return data;
  }

  async findAll() {
    return await this.userPermRepo.find();
  }

  async create(data: any) {
    const newData = this.userPermRepo.create(data);
    return await this.userPermRepo.save(newData);
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    await this.userPermRepo.update(id, data);
    return await this.findOne(id);
  }

  async delete(id: number) {
    await this.findOne(id);
    return await this.userPermRepo.delete(id);
  }
}
