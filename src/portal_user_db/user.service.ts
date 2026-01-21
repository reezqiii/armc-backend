import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository, ILike, FindOptionsWhere } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
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
        .leftJoinAndSelect("user.company", "company");

      const columnMap: Record<string, string> = {
        badge_no: "user.badge_no",
        username: "user.username",
        full_name: "user.full_name",
        email: "user.email",
        department_name: "dept.name_of_department",
        project_name: "project.project_name",
        company_name: "company.company_name",
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

      // 🔹 Ambil data dari DB
      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      // 🔹 Mapping nested object ke flat
      const mappedData = data.map((u) => ({
        ...u,
        department_name: u.department?.name_of_department ?? "-",
        project_name: u.project?.project_name ?? "-",
        company_name: u.company?.company_name ?? "-",
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
