import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not } from "typeorm";
import { User } from "./user.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import * as crypto from "crypto";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";

export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
    @InjectRepository(PortalRole)
    private readonly _role: Repository<PortalRole>,
    @InjectRepository(PortalDepartment)
    private readonly _dept: Repository<PortalDepartment>,
    @InjectRepository(PortalProject)
    private readonly _project: Repository<PortalProject>,
  ) {}

  hashMd5(data: string): string {
    if (!data) {
      return "";
    }
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async findAllForExport(filters: any) {
    const qb = this._user
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("user.position", "position")
      .leftJoinAndSelect("user.project", "project")
      .where("user.status_user = 1");

    if (filters) {
      if (filters.full_name)
        qb.andWhere("user.full_name ILIKE :name", {
          name: `%${filters.full_name}%`,
        });
      if (filters.username)
        qb.andWhere("user.username ILIKE :username", {
          username: `%${filters.username}%`,
        });
      if (filters.badge_no)
        qb.andWhere("user.badge_no ILIKE :badge", {
          badge: `%${filters.badge_no}%`,
        });
    }

    return qb.orderBy("user.id_user", "ASC").getMany();
  }

  async getUsersByRoles(roleNames: string[]) {
    return this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("LOWER(role.role_name) IN (:...roles)", {
        roles: roleNames.map((r) => r.toLowerCase()),
      })
      .andWhere("user.status_user = 1")
      .select(["user.id_user", "user.full_name", "user.badge_no"])
      .getMany();
  }

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .leftJoin("user.department", "department")
      .leftJoin("user.position", "position")
      .leftJoin("user.project", "project")
      .where("user.status_user = 1")

      .select([
        "user.id_user",
        "user.username",
        "user.badge_no",
        "user.full_name",
        "user.email",
        "role.role_name",
        "department.name_of_department",
        "position.position_name",
        "project.project_name",
      ]);

    const columnMap: Record<string, string> = {
      id_user: "user.id_user",
      full_name: "user.full_name",
      username: "user.username",
      badge_no: "user.badge_no",
      email: "user.email",
      project_name: "project.project_name",
      department_name: "department.name_of_department",
      position_name: "position.position_name",
      role_name: "role.role_name",
    };

    if (sort) {
      const [col, dir] = sort.split(",");
      const column = columnMap[col];
      if (column) qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
    } else {
      qb.orderBy("user.id_user", "DESC");
    }

    if (search) {
      try {
        const searchObj = JSON.parse(search);
        Object.keys(searchObj).forEach((key) => {
          const column = columnMap[key];
          if (!column) return;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${searchObj[key]}%`,
          });
        });
      } catch (e) {}
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

  async createUser(data: any): Promise<User> {
   
    const isExist = await this._user.findOne({
      where: { username: data.username },
    });

    if (isExist) {
      throw new ConflictException("Username is already registered");
    }

    const newUser = this._user.create({
      full_name: data.full_name,
      badge_no: data.badge_no,
      username: data.username,
      email: data.email,
      id_role: data.id_role,
      id_department: data.id_department,
      id_position: data.id_position,
      id_project: data.id_project,
      status_user: 1,
      created_by: data.admin_id,
    });

    return await this._user.save(newUser);
  }

  async updateUser(id: number, data: any) {
    const user = await this._user.findOne({ where: { id_user: id } });
    if (!user) throw new NotFoundException("User not found");

   
    if (data.username && data.username !== user.username) {
      const isExist = await this._user.findOne({
        where: { username: data.username, id_user: Not(id) }
      });

      if (isExist) {
        throw new ConflictException("Username is already used by another account");
      }
    }

    delete data.password;

    const adminId = data.admin_id;
    delete data.admin_id;

    Object.assign(user, { ...data, updated_by: adminId });
    return await this._user.save(user);
  }

  async deleteUser(id: number, admin_id: number) {
    const user = await this._user.findOne({ where: { id_user: id } });
    if (!user) throw new NotFoundException("User not found");

    user.status_user = 0;
    user.deleted_by = admin_id;
    return await this._user.save(user);
  }

  async findOneById(id: number) {
    const user = await this._user.findOne({
      where: { id_user: id, status_user: 1 },

      select: {
        id_user: true,
        full_name: true,
        badge_no: true,
        username: true,
        email: true,
        id_department: true,
        id_project: true,
        id_role: true,
        id_position: true,
        addon_project: true,
        role: { id_role: true, role_name: true },
        department: { id_department: true, name_of_department: true },
        position: { id_position: true, position_name: true },
        project: { id_project: true, project_name: true },
      },

      relations: ["role", "department", "position", "project"],
    });

    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async verifyAndSetNewPassword(token: string, newPassword: string) {
    const user = await this._user.findOne({
      where: { reset_token: token, status_user: 1 },
    });

    if (!user) {
      throw new NotFoundException("Invalid or already used reset token.");
    }

    const now = new Date();
    if (user.reset_token_expired < now) {
      throw new ConflictException("Reset link has expired (max 30 mins).");
    }

    await this._user.update(
      { id_user: user.id_user },
      {
        password: this.hashMd5(newPassword),
        reset_token: null,
        reset_token_expired: null,
      },
    );

    return { success: true, message: "Password updated successfully!" };
  }

  async resetPasswordByAdmin(id_user: number, admin_id: number) {
    const user = await this._user.findOne({
      where: { id_user, status_user: 1 },
    });
    if (!user) throw new NotFoundException("User not found");

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);

    await this._user.update(
      { id_user },
      {
        reset_token: resetToken,
        reset_token_expired: expiry,
        updated_by: admin_id,
      },
    );

    return {
      success: true,
      resetToken,
      fullName: user.full_name,
      email: user.email,
    };
  }

  async getUserStats() {
    try {
      const activeCount = await this._user.count({ where: { status_user: 1 } });

      const [roleCount, deptCount, projectCount] = await Promise.all([
        this._role.count(),
        this._dept.count(),
        this._project.count(),
      ]);

      const userPerRoleRaw = await this._user
        .createQueryBuilder("user")
        .leftJoin("user.role", "role")
        .select("role.role_name", "role_name")
        .addSelect("COUNT(user.id_user)", "total")
        .where("user.status_user = 1")
        .groupBy("role.role_name")
        .getRawMany();

      const recentReset = await this._user.find({
        where: {
          status_user: 1,
          reset_token_expired: Not(null),
        },
        order: { reset_token_expired: "DESC" },
        take: 6,
        select: ["full_name", "username", "reset_token_expired"],
      });

      return {
        active: activeCount,
        total: activeCount,
        totalRoles: roleCount,
        totalDept: deptCount,
        totalProject: projectCount,
        userPerRole: userPerRoleRaw.map((r) => ({
          role_name: r.role_name ?? "No Role",
          total: Number(r.total),
        })),
        recentReset: recentReset.map((u) => ({
          full_name: u.full_name,
          username: u.username,
          last_update_password: u.reset_token_expired,
        })),
      };
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      throw new InternalServerErrorException("Failed to fetch dashboard stats");
    }
  }

  async getHodsByDeptId(deptId: number) {
    return this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("user.id_department = :deptId", { deptId })
      .andWhere("role.role_name IN (:...roles)", {
        roles: ["Head Of Department", "Administrator"],
      })
      .select(["user.id_user", "user.badge_no", "user.full_name"])
      .getMany();
  }
}
