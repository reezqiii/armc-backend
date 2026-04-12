import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { PortalRole } from "./entities/portal_role_db.entity";
import { CreatePortalRoleDbDto } from "./dto/create-portal_role_db.dto";
import { UpdatePortalRoleDbDto } from "./dto/update-portal_role_db.dto";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalRoleDbService {
  constructor(
    @InjectRepository(PortalRole)
    private readonly roleRepository: Repository<PortalRole>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.roleRepository
      .createQueryBuilder("role")
      .where("role.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      role_name: "role.role_name",
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
    return {
      data,
      total,
      page,
      limit: take,
      total_pages: Math.ceil(total / take),
    };
  }

  async create(createDto: CreatePortalRoleDbDto, userId?: number) {
    const isExist = await this.roleRepository.findOne({
      where: { role_name: createDto.role_name, is_active: 1 },
    });

    if (isExist) {
      throw new ConflictException(
        `Role '${createDto.role_name}' already exists.`,
      );
    }

    const role = this.roleRepository.create({
      ...createDto,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.roleRepository.save(role);
  }

  async update(id: number, updateDto: UpdatePortalRoleDbDto, userId?: number) {
    const role = await this.findOne(id);

    const isExist = await this.roleRepository.findOne({
      where: {
        role_name: updateDto.role_name,
        is_active: 1,
        id_role: Not(id),
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Role name '${updateDto.role_name}' is already used.`,
      );
    }

    Object.assign(role, {
      ...updateDto,
      updated_by: userId ?? null,
    });
    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({
      where: { is_active: 1 },
      order: { role_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id_role: id, is_active: 1 },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async remove(id: number, userId?: number) {
    const role = await this.findOne(id);
    role.is_active = 0;
    role.deleted_by = userId ?? null;
    return this.roleRepository.save(role);
  }
}
