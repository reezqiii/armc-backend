import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssDept } from './iss_dept.entity';

@Injectable()
export class IssDeptService {
  constructor(
    @InjectRepository(IssDept)
    private readonly deptRepo: Repository<IssDept>,
  ) { }

  async findAll(): Promise<IssDept[]> {
    return this.deptRepo.find({
      order: {
        dept: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<IssDept> {
    const dept = await this.deptRepo.findOne({ where: { dept_id: id } });
    if (!dept) throw new NotFoundException(`Department with ID ${id} not found`);
    return dept;
  }

  async create(data: Partial<IssDept>): Promise<IssDept> {
    const dept = this.deptRepo.create(data);
    return await this.deptRepo.save(dept);
  }

  async update(id: number, data: Partial<IssDept>): Promise<IssDept> {
    const dept = await this.findOne(id);
    Object.assign(dept, data);
    return await this.deptRepo.save(dept);
  }

  async remove(id: number): Promise<void> {
    const dept = await this.findOne(id);
    await this.deptRepo.remove(dept);
  }
}
