import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, ILike } from "typeorm";
import { User } from "./user.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import * as crypto from "crypto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
  ) {}

  private hashMd5(data: string): string {
    return crypto.createHash("md5").update(data).digest("hex");
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
    const qb = this._user
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("user.position", "position");

    if (search) {
      const searchObj = JSON.parse(search);
      if (searchObj.full_name)
        qb.andWhere("user.full_name ILIKE :name", {
          name: `%${searchObj.full_name}%`,
        });
    }

    const [data, total] = await qb
      .skip(page * size)
      .take(size)
      .getManyAndCount();
    return { data, total, page, total_pages: Math.ceil(total / size) };
  }

  async createUser(data: any): Promise<User> {
    const newUser = this._user.create({
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      password: this.hashMd5(data.password),
      status_user: 1,
      created_by: data.admin_id,
      id_role: data.id_role,
      id_department: data.id_department,
      id_position: data.id_position,
    });

    return await this._user.save(newUser);
  }

  async updateUser(id: number, data: any) {
    const user = await this._user.findOne({ where: { id_user: id } });
    if (!user) throw new NotFoundException("User not found");
    Object.assign(user, { ...data, update_by: data.admin_id });
    return await this._user.save(user);
  }

  async findOneById(id: number) {
    return await this._user.findOne({
      where: { id_user: id },
      relations: ["role", "department", "position"],
    });
  }

  async findAll() {
    return await this._user.find({ where: { status_user: 1 } });
  }

  async resetPasswordByAdmin(id_user: number, admin_id: number) {
    const newPassword = Math.random().toString(36).slice(-8);
    await this._user.update(
      { id_user },
      { password: this.hashMd5(newPassword), updated_by: admin_id },
    );
    return { success: true, newPassword };
  }
}
