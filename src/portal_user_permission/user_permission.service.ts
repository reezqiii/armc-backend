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

  async getUserExtraPermissions(userId: number) {
    const permissions = await this.permissionRepo.manager.query(
      `
    SELECT 
      p.id_permission, 
      p.permission_name, 
      p.permission_group,
      CASE 
        WHEN up.id_user IS NOT NULL THEN true 
        ELSE false 
      END as assigned
    FROM portal_permission p
  
    LEFT JOIN portal_user_permission up ON up.id_portal_permission = p.id_permission 
      AND up.id_user = $1
    WHERE p.is_active = 1
    ORDER BY p.permission_group ASC, p.permission_name ASC
  `,
      [userId],
    );

    return permissions.map((p) => ({
      id_permission: Number(p.id_permission),
      permission_name: p.permission_name,
      permission_group: p.permission_group,
      assigned: p.assigned === true || p.assigned === "true",
    }));
  }

  async getPermissionIds(id_user: number, id_role: number): Promise<number[]> {
    const count = await this.userPermRepo.count({ where: { id_user } });

    if (count > 0) {
      const userPermissions = await this.userPermRepo.find({
        where: { id_user },
        select: ["id_portal_permission"],
      });
      return userPermissions.map((up) => Number(up.id_portal_permission));
    }

    const rolePermissions = await this.rolePermRepo.find({
      where: { id_role: id_role },
      select: ["id_permission"],
    });

    return rolePermissions.map((rp) => Number(rp.id_permission));
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
      } else {
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
