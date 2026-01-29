import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository, ILike, FindOptionsWhere } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { Company } from "portal_company/company.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
    @InjectRepository(PortalDepartment)
    private readonly _departmentRepo: Repository<PortalDepartment>,
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
        .leftJoinAndSelect("user.department", "dept")
        .leftJoinAndSelect("user.project", "project")
        .leftJoinAndSelect("user.company", "company")
        .leftJoinAndSelect("user.role", "role")
        .where("user.status_user = :status", { status: 1 });

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

      const mappedData = data.map((u) => ({
        ...u,
        department_name: u.department?.name_of_department ?? "-",
        project_name: u.project?.project_name ?? "-",
        company_name: u.company?.company_name ?? "-",
        role_name: u.role?.role_name ?? "-",
      }));

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
        relations: ["department", "project"],
        order: { full_name: "ASC" },
      });

      return users;
    } catch (error) {
      console.error("Failed to search users:", error);
      throw new InternalServerErrorException(error);
    }
  }

  async findOneById(id: number): Promise<User | null> {
    try {
      return await this._user.findOne({
        where: { id_user: id, status_user: 1 },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(data: any): Promise<User> {
    const department = data.dept_id
      ? await this._departmentRepo.findOne({
          where: { id_department: data.dept_id },
        })
      : null;

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

    const newUser = this._user.create({
      full_name: data.full_name,
      email: data.email,
      badge_no: data.badge_no,
      username: data.username,
      status_user: 1,
      created_date: new Date(),
      department,
      project,
      company,
      role,
    });

    return await this._user.save(newUser);
  }

  // async updateUser(id: number, data: Partial<User>): Promise<User> {
  //   const user = await this._user.findOne({ where: { id_user: id } });
  //   if (!user) throw new NotFoundException('User not found');

  //   Object.assign(user, data);
  //   return await this._user.save(user);
  // }

  // // Insert
  // async createUser(data: Partial<User>): Promise<User> {
  //   const newUser = this._user.create(data);
  //   return await this._user.save(newUser); // log type = 2 (insert)
  // }

  // // Delete
  // async deleteUser(id: number): Promise<void> {
  //   const user = await this._user.findOne({ where: { id_user: id } });
  //   if (!user) throw new NotFoundException('User not found');

  //   await this._user.remove(user); // log type = 3 (delete)
  // }
}
