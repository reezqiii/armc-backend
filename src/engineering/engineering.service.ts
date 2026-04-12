import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Engineering } from "./entities/engineering.entity";

@Injectable()
export class EngineeringService {
  constructor(
    @InjectRepository(Engineering)
    private repo: Repository<Engineering>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }

  // --- TAMBAHKAN BLOK INI ---
  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record)
      throw new NotFoundException(`Engineering record with ID ${id} not found`);
    return record;
  }
  // --------------------------

  create(data: Partial<Engineering>) {
    const newWO = this.repo.create(data);
    return this.repo.save(newWO);
  }

  async update(id: number, data: Partial<Engineering>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  async remove(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record) throw new NotFoundException("Data not found");
    return this.repo.remove(record);
  }
}
