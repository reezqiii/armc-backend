import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private repo: Repository<Warehouse>,
  ) {}

  // Ambil semua data
  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  // Ambil satu data berdasarkan ID (Penting untuk halaman Edit)
  async findOne(id: number) {
    const record = await this.repo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return record;
  }

  // Simpan data baru
  create(data: Partial<Warehouse>) {
    const newItem = this.repo.create(data);
    return this.repo.save(newItem);
  }

  // Update data (Penting untuk fitur Edit)
  async update(id: number, data: Partial<Warehouse>) {
    const record = await this.findOne(id); // Validasi apakah data ada
    Object.assign(record, data); // Timpa data lama dengan data baru
    return this.repo.save(record);
  }

  // Hapus data
  async remove(id: number) {
    const record = await this.findOne(id);
    return this.repo.remove(record);
  }
}