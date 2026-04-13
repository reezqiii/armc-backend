import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { Position } from "./entities/portal_position.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalPositionService {
  constructor(
    @InjectRepository(Position)
    private readonly repository: Repository<Position>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb = this.repository
      .createQueryBuilder("position")
      .leftJoinAndSelect(
        "portal_role_db",
        "role",
        "role.id_role = position.id_role",
      ) 
      .select([
        "position",
        "role.role_name", 
      ])
      .where("position.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      position_name: "position.position_name",
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

  async create(dto: any, userId?: number) {
    const isExist = await this.repository.findOne({
      where: {
        position_name: dto.position_name,
        is_active: 1,
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Position name '${dto.position_name}' already exists.`,
      );
    }

    const newPos = this.repository.create({
      ...dto,
      is_active: 1,
      created_by: userId ?? null,
    });

    return await this.repository.save(newPos);
  }

  async update(id: number, dto: any, userId?: number) {
    const data = await this.findOne(id);

    const isExist = await this.repository.findOne({
      where: {
        position_name: dto.position_name,
        is_active: 1,
        id_position: Not(id),
      },
    });

    if (isExist) {
      throw new ConflictException(
        `Position '${dto.position_name}' is already used by another record.`,
      );
    }

    Object.assign(data, {
      ...dto,
      updated_by: userId ?? null,
    });

    return await this.repository.save(data);
  }

  async remove(id: number, userId?: number) {
    const data = await this.findOne(id);
    data.is_active = 0;
    data.deleted_by = userId ?? null;
    return await this.repository.save(data);
  }

  async findAll() {
    return await this.repository.find({
      where: { is_active: 1 },
      order: { position_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const data = await this.repository.findOneBy({ id_position: id, is_active: 1 });
    if (!data) throw new NotFoundException("Position not found");
    return data;
  }
}
