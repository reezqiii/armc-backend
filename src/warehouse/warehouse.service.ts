import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Warehouse } from "./entities/warehouse.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { User } from "portal_user_db/user.entity";

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

      const qb = this.repo
        .createQueryBuilder("item")
        .leftJoin(User, "creator", "creator.id_user = item.created_by")

        .leftJoin(User, "approver", "approver.id_user = item.approved_by")
        .leftJoin(User, "rejector", "rejector.id_user = item.rejected_by")
        .select([
          "item.id_item as id",
          "item.item_code as item_code",
          "item.item_name as item_name",
          "item.category as category",
          "item.quantity as quantity",
          "item.location as location",
          "item.unit as unit",
          "item.status as status",
          "item.remarks as remarks",
          "creator.full_name as creator_name",
          "approver.full_name as approver_name",
          "rejector.full_name as rejector_name",
        ]);

      const columnMap: Record<string, string> = {
        id: "item.id_item",
        id_item: "item.id_item",
        item_code: "item.item_code",
        item_name: "item.item_name",
        category: "item.category",
        quantity: "item.quantity",
        location: "item.location",
        status: "item.status",
        creator_name: "creator.full_name",
      };

      if (search) {
        const filters = JSON.parse(search);
        for (const [key, value] of Object.entries(filters)) {
          if (!value && value !== 0) continue;
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

      const [data, totalCount] = await Promise.all([
        qb.offset(skip).limit(take).getRawMany(),
        qb.getCount(),
      ]);

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

  async findAll() {
    return this.repo.find({ order: { id_item: "DESC" } });
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id_item: id });
    if (!record) throw new NotFoundException(`Item ID ${id} not found`);
    return record;
  }

  async create(data: Partial<Warehouse>, userId?: number) {
    const newItem = this.repo.create({
      ...data,
      status: 1,
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

  async approve(id: number, userId: number) {
    const record = await this.findOne(id);
    record.status = 2;
    record.approved_by = userId;
    record.rejected_by = null;
    record.updated_by = userId;
    return this.repo.save(record);
  }

  async reject(id: number, userId: number, remarks?: string) {
    const record = await this.findOne(id);
    record.status = 3;
    record.rejected_by = userId;
    record.approved_by = null;
    record.remarks = remarks || null;
    record.updated_by = userId;
    return this.repo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return this.repo.remove(record);
  }
}
