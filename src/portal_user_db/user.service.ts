import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository, ILike, FindOptionsWhere, In } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { Company } from "portal_company/company.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { IssDept } from "iss_dept/iss_dept.entity";

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
        department_name: "user.department",
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
            deptName = dept?.name_department ?? "-";
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
        project_id: u.project?.id_project ?? null,
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
      ? await this._projectRepo.findOne({ where: { id_project: data.project_id } })
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
      ? await this._projectRepo.findBy({ id_project: In(data.project_ids) })
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

  async bulkUpdateUsers(
    users: {
      id_user: number;
      outside_access?: number;
      status_user?: number;
      role_id?: number;
      department_id?: number;
    }[],
  ) {
    if (!users?.length) {
      return { success: false, message: "No data to update" };
    }

    for (const u of users) {
      const updateData: any = {};

      if (u.outside_access !== undefined) {
        updateData.outside_access = u.outside_access;
      }

      if (u.status_user !== undefined) {
        updateData.status_user = u.status_user;
      }

      if (u.department_id !== undefined) {
        updateData.department = u.department_id;
      }

      if (u.role_id !== undefined) {
        const role = await this._roleRepo.findOne({
          where: { id_role: u.role_id },
        });
        if (!role) {
          throw new NotFoundException("Role not found");
        }
        updateData.role = role;
      }

      await this._user.update({ id_user: u.id_user }, updateData);
    }

    return {
      success: true,
      updated_count: users.length,
    };
  }
}
