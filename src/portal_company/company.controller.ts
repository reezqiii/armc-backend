import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';

@Controller('portal_company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) { }

  @Get('list')
  async getAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Company>): Promise<Company> {
    return this.companyService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Company>): Promise<Company> {
    return this.companyService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.companyService.remove(id);
  }
}
