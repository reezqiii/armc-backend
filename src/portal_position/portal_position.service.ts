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
      .leftJoin("portal_role_db", "role", "role.id_role = position.id_role")
      .select([
        "position.id_position AS id_position",
        "position.position_name AS position_name",
        "position.is_active AS is_active",
        "role.role_name AS role_name",
      ])
      .where("position.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      position_name: "position.position_name",
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

    const data = await qb.offset(skip).limit(take).getRawMany();
    const total = await qb.getCount();

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
      return {
        success: false,
        message: `Position name '${dto.position_name}' already exists.`,
      };
    }

    const newPos = this.repository.create({
      ...dto,
      is_active: 1,
      created_by: userId ?? null,
    });

    const saved = await this.repository.save(newPos);
    return {
      success: true,
      message: "Position created successfully",
      data: saved,
    };
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
      return {
        success: false,
        message: `Position '${dto.position_name}' is already used by another record.`,
      };
    }

    Object.assign(data, {
      ...dto,
      updated_by: userId ?? null,
    });

    const updated = await this.repository.save(data);
    return {
      success: true,
      message: "Position updated successfully",
      data: updated,
    };
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
    const data = await this.repository.findOneBy({
      id_position: id,
      is_active: 1,
    });
    if (!data) throw new NotFoundException("Position not found");
    return data;
  }
}
