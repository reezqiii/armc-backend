import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductionBatch } from "./entities/production.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { User } from "portal_user_db/user.entity";

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionBatch)
    private repo: Repository<ProductionBatch>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.repo
        .createQueryBuilder("production")
        .leftJoin(User, "creator", "creator.id_user = production.created_by")
        .select([
          "production.id as id",
          "production.batch_id as batch_id",
          "production.product_name as product_name",
          "production.qc_status as qc_status",
          "production.created_by as created_by",
          "creator.full_name as creator_name",
        ]);

      const columnMap: Record<string, string> = {
        id: "production.id",
        batch_id: "production.batch_id",
        product_name: "production.product_name",
        qc_status: "production.qc_status",
      };

      if (search) {
        const filters = JSON.parse(search);
        for (const [key, value] of Object.entries(filters)) {
          if (!value) continue;
          const column = columnMap[key] ?? `production.${key}`;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        qb.orderBy(
          columnMap[field] ?? `production.${field}`,
          dir.toUpperCase() as any,
        );
      } else {
        qb.orderBy("production.id", "DESC");
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
        "Server-side processing failed: " + error.message,
      );
    }
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record)
      throw new NotFoundException(`Production with ID ${id} not found`);
    return record;
  }

  async create(data: Partial<ProductionBatch>, userId?: number) {
    const newBatch = this.repo.create({
      ...data,
      created_by: userId,
    });
    return this.repo.save(newBatch);
  }

  async update(id: number, data: Partial<ProductionBatch>, userId?: number) {
    await this.findOne(id);
    await this.repo.update(id, {
      ...data,
      updated_by: userId,
    });
    return this.findOne(id);
  }

  async remove(id: number, userId?: number) {
    const record = await this.findOne(id);

    return this.repo.remove(record);
  }
}
