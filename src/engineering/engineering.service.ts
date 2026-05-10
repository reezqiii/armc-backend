import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { User } from "portal_user_db/user.entity";
import { Engineering } from "./entities/engineering.entity";

@Injectable()
export class EngineeringService {
  constructor(
    @InjectRepository(Engineering)
    private repo: Repository<Engineering>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.repo
        .createQueryBuilder("eng")
        .leftJoin(User, "creator", "creator.id_user = eng.created_by")
        .leftJoin(User, "approver", "approver.id_user = eng.approved_by")
        .leftJoin(User, "rejector", "rejector.id_user = eng.rejected_by")
        .select([
          "eng.id_wo as id_wo",
          "eng.wo_number as wo_number",
          "eng.equipment_name as equipment_name",
          "eng.priority as priority",
          "eng.status as status",
          "eng.remarks as remarks",
          "creator.full_name as creator_name",
          "approver.full_name as approver_name",
          "rejector.full_name as rejector_name",
        ]);

      const columnMap: Record<string, string> = {
        id_wo: "eng.id_wo",
        wo_number: "eng.wo_number",
        equipment_name: "eng.equipment_name",
        status: "eng.status",
        priority: "eng.priority",
      };

      if (search) {
        const filters = JSON.parse(search);
        for (const [key, value] of Object.entries(filters)) {
          if (!value && value !== 0) continue;
          const column = columnMap[key] ?? `eng.${key}`;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        qb.orderBy(
          columnMap[field] ?? `eng.${field}`,
          dir.toUpperCase() as any,
        );
      } else {
        qb.orderBy("eng.id_wo", "DESC");
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
        "Server-side failed: " + error.message,
      );
    }
  }

  async findAll() {
    return this.repo.find({ order: { id_wo: "DESC" } });
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id_wo: id });
    if (!record)
      throw new NotFoundException(`Engineering WO with ID ${id} not found`);
    return record;
  }

  async create(data: Partial<Engineering>, userId?: number) {
    const newWo = this.repo.create({ ...data, status: 1, created_by: userId });
    return this.repo.save(newWo);
  }

  async update(id: number, data: Partial<Engineering>, userId?: number) {
    await this.findOne(id);
    await this.repo.update(id, { ...data, updated_by: userId });
    return this.findOne(id);
  }

  async approve(id: number, userId: number) {
    const record = await this.findOne(id);
    record.status = 3;
    record.approved_by = userId;
    record.rejected_by = null;
    record.updated_by = userId;
    return this.repo.save(record);
  }

  async reject(id: number, userId: number, remarks?: string) {
    const record = await this.findOne(id);
    record.status = 4;
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
