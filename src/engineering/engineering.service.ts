import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Engineering } from "./entities/engineering.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class EngineeringService {
  constructor(
    @InjectRepository(Engineering)
    private readonly repo: Repository<Engineering>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.repo.createQueryBuilder("wo");

      const columnMap: Record<string, string> = {
        id_wo: "wo.id_wo",
        wo_number: "wo.wo_number",
        equipment_name: "wo.equipment_name",
        priority: "wo.priority",
        status: "wo.status",
      };

      if (search) {
        const filters = JSON.parse(search);
        for (const [key, value] of Object.entries(filters)) {
          if (!value) continue;
          const column = columnMap[key] ?? `wo.${key}`;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        qb.orderBy(columnMap[field] ?? `wo.${field}`, dir.toUpperCase() as any);
      } else {
        qb.orderBy("wo.id_wo", "DESC");
      }

      const [data, totalCount] = await qb
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return {
        data,
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / take),
        page,
        size: take,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        "Engineering server-side error: " + error.message,
      );
    }
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id_wo: id });
    if (!record)
      throw new NotFoundException(`Engineering record with ID ${id} not found`);
    return record;
  }

  async create(data: Partial<Engineering>, userId?: number) {
    const newWO = this.repo.create({
      ...data,
      created_by: userId,
    });
    return this.repo.save(newWO);
  }

  async update(id: number, data: Partial<Engineering>, userId?: number) {
    await this.findOne(id);
    await this.repo.update(id, {
      ...data,
      updated_by: userId,
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return this.repo.remove(record);
  }
}
