import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Engineering } from "./entities/engineering.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { User } from "portal_user_db/user.entity";

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

      const qb = this.repo
        .createQueryBuilder("wo")
        .leftJoin(User, "creator", "creator.id_user = wo.created_by")
        .select([
          "wo.id_wo as id",
          "wo.wo_number as wo_number",
          "wo.equipment_name as equipment_name",
          "wo.priority as priority",
          "wo.status as status",
          "wo.created_by as created_by",
          "creator.full_name as creator_name",
        ]);

      const columnMap: Record<string, string> = {
        id: "wo.id_wo",
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

  async create(data: any, userId?: number) {
    let priorityInt = 1;

    if (typeof data.priority === "string") {
      const p = data.priority.toLowerCase();
      if (p === "medium") priorityInt = 2;
      else if (p === "high") priorityInt = 3;
    } else if (typeof data.priority === "number") {
      priorityInt = data.priority;
    }

    const newWO = this.repo.create({
      ...data,
      priority: priorityInt,
      created_by: userId,
    });

    return this.repo.save(newWO);
  }

  async update(id: number, data: any, userId?: number) {
    await this.findOne(id);

    let priorityInt = data.priority;
    if (typeof data.priority === "string") {
      const p = data.priority.toLowerCase();
      if (p === "low") priorityInt = 1;
      else if (p === "medium") priorityInt = 2;
      else if (p === "high") priorityInt = 3;
    }

    await this.repo.update(id, {
      ...data,
      ...(data.priority && { priority: priorityInt }),
      updated_by: userId,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return this.repo.remove(record);
  }
}
