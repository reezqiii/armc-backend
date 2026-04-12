import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Warehouse } from "./entities/warehouse.entity";

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private repo: Repository<Warehouse>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return record;
  }

  create(data: Partial<Warehouse>) {
    const newItem = this.repo.create(data);
    return this.repo.save(newItem);
  }

  async update(id: number, data: Partial<Warehouse>) {
    const record = await this.findOne(id);
    Object.assign(record, data);
    return this.repo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return this.repo.remove(record);
  }
}
