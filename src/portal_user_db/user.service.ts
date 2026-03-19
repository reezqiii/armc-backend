import {
  BadRequestException,
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
import { Company } from "portal_company/company.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import * as md5 from "md5";
import * as crypto from "crypto";
import { EmailService } from "email/email.service";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { PortalPermission } from "portal_permission/permission.entity";
import { PortalUserPermission } from "portal_user_permission/user_permission.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
    @InjectRepository(PortalDepartment)
    private readonly _portalDeptRepo: Repository<PortalDepartment>,
    @InjectRepository(PortalProject)
    private readonly _projectRepo: Repository<PortalProject>,
    @InjectRepository(Company)
    private readonly _companyRepo: Repository<Company>,
    @InjectRepository(PortalRole)
    private readonly _roleRepo: Repository<PortalRole>,
    @InjectRepository(PortalUserPermission)
    private readonly _userPermRepo: Repository<PortalUserPermission>,
    @InjectRepository(PortalPermission)
    private readonly _permissionRepo: Repository<PortalPermission>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this._user
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.project", "project")
        .leftJoinAndSelect("user.company", "company")
        .leftJoinAndSelect("user.role", "role");

      const columnMap: Record<string, string> = {
        badge_no: "user.badge_no",
        username: "user.username",
        full_name: "user.full_name",
        email: "user.email",
        department_name: "dept.name_of_department",
        project_name: "project.project_name",
        company_name: "company.company_name",
        role_name: "role.role_name",
        created_date: "user.created_date",
        active: "user.active",
        status_user: "user.status_user",
      };

      // SORT
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col];
        if (column) qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }

      // SEARCH
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

      const mappedData = await Promise.all(
        data.map(async (u) => {
          let deptName = "-";
          if (u.department) {
            const dept = await this._portalDeptRepo.findOne({
              where: { id_department: u.department },
            });
            deptName = dept?.name_of_department ?? "-";
          }

          return {
            ...u,
            department_name: deptName,
            project_name: u.project?.project_name ?? "-",
            company_name: u.company?.company_name ?? "-",
            role_name: u.role?.role_name ?? "-",
          };
        }),
      );

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
        relations: ["project", "company", "role"],
      });

      if (!u) return null;

      return {
        id_user: u.id_user,
        badge_no: u.badge_no,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        dept_id: u.department,
        project_id: u.project?.id ?? null,
        company_id: u.company?.id_company ?? null,
        id_role: u.role?.id_role ?? null,
        status_user: u.status_user,
        outside_access: u.outside_access,
        portal_type: u.portal_type,
        dept_ids: u.dept_alt ? u.dept_alt.split(";").map(Number) : [],
        project_ids: u.addon_project
          ? u.addon_project.split(";").map(Number)
          : [],
        access_yard_company: u.yard_company
          ? u.yard_company.split(";").map(Number)
          : [],
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(data: any): Promise<User> {
    const project = data.project_id
      ? await this._projectRepo.findOne({ where: { id: data.project_id } })
      : null;

    const company = data.company_id
      ? await this._companyRepo.findOne({
          where: { id_company: data.company_id },
        })
      : null;

    const role = data.id_role
      ? await this._roleRepo.findOne({ where: { id_role: data.id_role } })
      : null;

    const yardAccessCompanies = data.access_yard_company?.length
      ? await this._companyRepo.findBy({
          id_company: In(data.access_yard_company),
        })
      : [];
    const addonProjects = data.project_ids?.length
      ? await this._projectRepo.findBy({ id: In(data.project_ids) })
      : [];

    const newUser = this._user.create({
      full_name: data.full_name,
      email: data.email,
      badge_no: data.badge_no,
      username: data.username,
      status_user: 1,
      created_date: new Date(),
      department: data.department ?? null,
      project,
      company,
      role,
      outside_access: data.outside_access ?? null,
      portal_type: data.portal_type ?? null,
      yard_company: data.access_yard_company?.join(";") ?? null,
      addon_project: data.project_ids?.join(";") ?? null,
    });

    return await this._user.save(newUser);
  }

  async updateUser(id: number, data: any): Promise<User> {
    const user = await this._user.findOne({
      where: { id_user: id },
      relations: ["project", "company", "role"],
    });

    if (!user) throw new NotFoundException("User not found");

    const project = data.project_id
      ? await this._projectRepo.findOne({ where: { id: data.project_id } })
      : null;

    const company = data.company_id
      ? await this._companyRepo.findOne({
          where: { id_company: data.company_id },
        })
      : null;

    const role = data.id_role
      ? await this._roleRepo.findOne({ where: { id_role: data.id_role } })
      : null;

    Object.assign(user, {
      full_name: data.full_name,
      email: data.email,
      badge_no: data.badge_no,
      username: data.username,
      department: data.department ?? null,
      project,
      company,
      role,
      outside_access: data.outside_access ?? null,
      portal_type: data.portal_type ?? null,
      status_user: data.status_user ?? 1,
      yard_company: data.access_yard_company?.join(";") ?? null,
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
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await this._user.update({ id_user }, {
      password: md5(newPassword),
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

    // User per role
    const userPerRole = await this._user
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .select("role.role_name", "role_name")
      .addSelect("COUNT(user.id_user)", "total")
      .where("user.status_user = :status", { status: 1 })
      .groupBy("role.role_name")
      .getRawMany();

    // Recent password reset
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
    // Ambil semua permission yang tersedia
    const allPermissions = await this._permissionRepo.find({
      where: { is_active: 1 },
      order: { id_permission: "ASC" },
    });

    // Ambil permission tambahan yang sudah dimiliki user ini
    const userExtraPerms = await this._userPermRepo.find({
      where: { id_user },
    });

    const userPermKeys = userExtraPerms
      .map((p) => p.permission_key)
      .filter((k) => k !== null && k !== undefined);

    // Return semua permission + flag is_granted untuk checklist frontend
    return allPermissions.map((p) => ({
      id_permission: p.id_permission,
      permission_name: p.permission_name,
      index_key: p.index_key,
      is_granted: userPermKeys.includes(p.index_key),
    }));
  }

  // PUT — update permission tambahan user dari checklist
  async updateUserExtraPermissions(
    id_user: number,
    permission_keys: string[],
    created_by: number,
  ) {
    // Hapus semua permission_key lama milik user ini
    await this._userPermRepo
      .createQueryBuilder()
      .delete()
      .where("id_user = :id_user AND permission_key IS NOT NULL", { id_user })
      .execute();

    // Insert yang baru dari checklist (kalau ada)
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
      .andWhere("user.department = :dept_id", { dept_id })
      .select(["user.id_user", "user.full_name", "user.badge_no"])
      .orderBy("user.full_name", "ASC")
      .getMany();
  }
}
