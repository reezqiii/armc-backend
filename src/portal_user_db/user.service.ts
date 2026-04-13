import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository, ILike, FindOptionsWhere, In, IsNull, Not } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import * as crypto from "crypto";
import { EmailService } from "email/email.service";
import { ConfigService } from "@nestjs/config";
import { PortalPermission } from "portal_permission/permission.entity";
import { PortalUserPermission } from "portal_user_permission/user_permission.entity";
import md5 from "md5";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
    @InjectRepository(PortalDepartment)
    private readonly _portalDeptRepo: Repository<PortalDepartment>,
    @InjectRepository(PortalProject)
    private readonly _projectRepo: Repository<PortalProject>,
    @InjectRepository(PortalRole)
    private readonly _roleRepo: Repository<PortalRole>,
    @InjectRepository(PortalUserPermission)
    private readonly _userPermRepo: Repository<PortalUserPermission>,
    @InjectRepository(PortalPermission)
    private readonly _permissionRepo: Repository<PortalPermission>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private hashMd5(data: string): string {
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this._user
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.project", "project")
        .leftJoinAndSelect("user.role", "role")
        .leftJoinAndSelect("user.department", "department")
        .leftJoinAndSelect("user.position", "position");

      const columnMap: Record<string, string> = {
        badge_no: "user.badge_no",
        username: "user.username",
        full_name: "user.full_name",
        email: "user.email",
        department_name: "department.name_of_department",
        position_name: "position.position_name",
        project_name: "project.project_name",
        role_name: "role.role_name",
        created_date: "user.created_date",
        active: "user.active",
        status_user: "user.status_user",
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

      const mappedData = data.map((u) => {
        return {
          ...u,
          department_name: u.department?.name_of_department ?? "-",
          position_name: u.position?.position_name ?? "-",
          project_name: u.project?.project_name ?? "-",
          role_name: u.role?.role_name ?? "-",
        };
      });

      return {
        data: mappedData,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getUsersByRoles(roleNames: string[]) {
    if (!roleNames?.length) {
      return [];
    }

    return this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("LOWER(role.role_name) IN (:...roles)", {
        roles: roleNames.map((r) => r.toLowerCase()),
      })
      .andWhere("user.status_user = :status", { status: 1 })
      .select(["user.id_user", "user.full_name", "user.badge_no"])
      .orderBy("user.full_name", "ASC")
      .getMany();
  }

  async findAll(): Promise<User[]> {
    try {
      return await this._user.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async searchUsers(query?: string): Promise<User[]> {
    try {
      const where: FindOptionsWhere<User> = query
        ? { full_name: ILike(`%${query}%`) }
        : {};

      const users = await this._user.find({
        where,
        relations: ["project"],
        order: { full_name: "ASC" },
      });

      return users;
    } catch (error) {
      console.error("Failed to search users:", error);
      throw new InternalServerErrorException(error);
    }
  }

  async findOneById(id: number) {
    try {
      const u = await this._user.findOne({
        where: { id_user: id },

        relations: ["project", "role", "department", "position"],
      });

      if (!u) return null;

      return {
        id_user: u.id_user,
        badge_no: u.badge_no,
        full_name: u.full_name,
        username: u.username,
        email: u.email,

        id_department: u.id_department,
        id_position: u.id_position,
        id_project: u.project?.id_project ?? null,
        id_role: u.role?.id_role ?? null,
        role: u.role
          ? {
              id_role: u.role.id_role,
              role_name: u.role.role_name,
            }
          : null,
        role_name: u.role?.role_name ?? "No Role",
        status_user: u.status_user,
        project_ids: u.addon_project
          ? u.addon_project.split(";").map(Number)
          : [],
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(data: any): Promise<User> {
    const userExist = await this._user.findOne({
      where: { username: data.username },
    });

    if (userExist) {
      throw new ConflictException(
        `Username '${data.username}' is already taken.`,
      );
    }

    const project = data.id_project
      ? await this._projectRepo.findOne({
          where: { id_project: data.id_project },
        })
      : null;

    const role = data.id_role
      ? await this._roleRepo.findOne({ where: { id_role: data.id_role } })
      : null;

    const newUser = this._user.create({
      full_name: data.full_name,
      email: data.email,
      badge_no: data.badge_no,
      username: data.username,
      status_user: 1,
      created_date: new Date(),
      id_department: data.id_department ?? null,
      id_position: data.id_position ?? null,
      project,
      role,
      addon_project: data.project_ids?.join(";") ?? null,
    });

    return await this._user.save(newUser);
  }

  async updateUser(id: number, data: any): Promise<User> {
    const user = await this._user.findOne({ where: { id_user: id } });
    if (!user) throw new NotFoundException("User not found");

    const isExist = await this._user.findOne({
      where: {
        username: data.username,
        id_user: Not(id),
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Username '${data.username}' is already used by another account.`,
      );
    }

    const project = data.id_project
      ? await this._projectRepo.findOne({
          where: { id_project: data.id_project },
        })
      : null;

    const role = data.id_role
      ? await this._roleRepo.findOne({ where: { id_role: data.id_role } })
      : null;

    Object.assign(user, {
      ...data,
      project,
      id_department: data.id_department ?? null,
      id_position: data.id_position ?? null,
      role,
      addon_project: data.project_ids?.join(";") ?? null,
    });

    return await this._user.save(user);
  }

  async resetPasswordByAdmin(id_user: number) {
    const user = await this._user.findOne({ where: { id_user } });
    if (!user) throw new NotFoundException("User not found");

    const newPassword = Math.random().toString(36).slice(-8);

    if (newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000);

    await this._user.update({ id_user }, {
      password: this.hashMd5(newPassword),
      last_update_password: new Date(),
      reset_token: resetToken,
      reset_token_expired: expiredAt,
    } as any);

    const resetLink = `${process.env.ARMC_BASE_URL}/reset_password?token=${resetToken}`;

    if (user.email) {
      const htmlContent = this.emailService.renderTemplate(
        "reset_password_admin.ejs",
        {
          fullName: user.full_name,
          username: user.username,
          newPassword,
          resetLink,
        },
      );

      await this.emailService.sendSimpleEmail(
        user.email,
        "Password Reset by Admin - ARMC Portal",
        htmlContent,
      );
    }

    return {
      success: true,
      message: "Password has been reset",
    };
  }

  async getStats() {
    const active = await this._user.count({ where: { status_user: 1 } });
    const totalRoles = await this._roleRepo.count({ where: { is_active: 1 } });
    const totalDept = await this._portalDeptRepo.count({
      where: { is_active: 1 },
    });
    const totalProject = await this._projectRepo.count({
      where: { is_active: 1 },
    });

    const userPerRole = await this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .select("role.role_name", "role_name")
      .addSelect("COUNT(user.id_user)", "total")
      .where("user.status_user = :status", { status: 1 })
      .groupBy("role.role_name")
      .getRawMany();

    const recentReset = await this._user.find({
      where: { last_update_password: Not(IsNull()) },
      order: { last_update_password: "DESC" },
      take: 5,
      select: ["id_user", "full_name", "username", "last_update_password"],
    });

    return {
      active,
      totalRoles,
      totalDept,
      totalProject,
      userPerRole,
      recentReset,
    };
  }

  async getUserExtraPermissions(id_user: number) {
    const allPermissions = await this._permissionRepo.find({
      where: { is_active: 1 },
      order: { id_permission: "ASC" },
    });

    const userExtraPerms = await this._userPermRepo.find({
      where: { id_user },
    });

    const userPermKeys = userExtraPerms
      .map((p) => p.permission_key)
      .filter((k) => k !== null && k !== undefined);

    return allPermissions.map((p) => ({
      id_permission: p.id_permission,
      permission_name: p.permission_name,
      permission_key: p.permission_key,
      is_granted: userPermKeys.includes(p.permission_key),
    }));
  }

  async updateUserExtraPermissions(
    id_user: number,
    permission_keys: string[],
    created_by: number,
  ) {
    await this._userPermRepo
      .createQueryBuilder()
      .delete()
      .where("id_user = :id_user AND permission_key IS NOT NULL", { id_user })
      .execute();

    if (permission_keys.length > 0) {
      const newPerms = permission_keys.map((key) =>
        this._userPermRepo.create({
          id_user,
          permission_key: key,
          create_by: created_by,
          create_date: new Date(),
        }),
      );
      await this._userPermRepo.save(newPerms);
    }

    return {
      success: true,
      message: `Updated ${permission_keys.length} extra permissions for user ${id_user}`,
      permission_keys,
    };
  }

  async getHodsByDept(dept_id: number) {
    return this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("LOWER(role.role_name) = :role", { role: "head of department" })
      .andWhere("user.status_user = :status", { status: 1 })
      .andWhere("user.id_department = :dept_id", { dept_id })
      .select(["user.id_user", "user.full_name", "user.badge_no"])
      .orderBy("user.full_name", "ASC")
      .getMany();
  }
}
