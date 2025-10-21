import { Controller, Get } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Department } from './department.entity';

@Controller('portal_department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  async getAll(): Promise<Department[]> {
    return this.departmentService.findAll();
  }
}
