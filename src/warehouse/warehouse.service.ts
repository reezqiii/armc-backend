import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Warehouse } from "./entities/warehouse.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly repo: Repository<Warehouse>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.repo.createQueryBuilder("item");

      const columnMap: Record<string, string> = {
        id_item: "item.id_item",
        item_code: "item.item_code",
        item_name: "item.item_name",
        category: "item.category",
        quantity: "item.quantity",
        location: "item.location",
        status: "item.status",
      };

      if (search) {
        const filters = JSON.parse(search);
        for (const [key, value] of Object.entries(filters)) {
          if (!value) continue;
          const column = columnMap[key] ?? `item.${key}`;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        qb.orderBy(
          columnMap[field] ?? `item.${field}`,
          dir.toUpperCase() as any,
        );
      } else {
        qb.orderBy("item.id_item", "DESC");
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
        "Warehouse server-side error: " + error.message,
      );
    }
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id_item: id });
    if (!record) throw new NotFoundException(`Item ID ${id} not found`);
    return record;
  }

  async create(data: Partial<Warehouse>, userId?: number) {
    const newItem = this.repo.create({
      ...data,
      created_by: userId,
    });
    return this.repo.save(newItem);
  }

  async update(id: number, data: Partial<Warehouse>, userId?: number) {
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
