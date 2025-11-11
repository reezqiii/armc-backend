import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) { }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find({
      where: { status_delete: 1 },
      order: { company_name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Company> {
    return this.companyRepository.findOne({
      where: { id_company: id, status_delete: 1 }, 
    });
  }

  async create(data: Partial<Company>): Promise<Company> {
    const newCompany = this.companyRepository.create({
      ...data,
      status_delete: 1,
    });
    return this.companyRepository.save(newCompany);
  }

  async update(id: number, data: Partial<Company>): Promise<Company> {
    await this.companyRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.companyRepository.delete(id);
  }
}
