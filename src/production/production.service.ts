import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductionBatch } from "./entities/production.entity";

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionBatch)
    private repo: Repository<ProductionBatch>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }

  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException(`Production with ID ${id} not found`);
    }
    return record;
  }

  create(data: Partial<ProductionBatch>) {
    const newBatch = this.repo.create(data);
    return this.repo.save(newBatch);
  }

  async update(id: number, data: Partial<ProductionBatch>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  async remove(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException("Data not found");
    return this.repo.remove(record);
  }
}
