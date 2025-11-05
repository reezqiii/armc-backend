import { Controller, Get, Query, ParseIntPipe, NotFoundException, Param } from '@nestjs/common';
import { IssEmployeeService } from './employee.service';

@Controller('iss_employee')
export class IssEmployeeController {
  constructor(private readonly employeeService: IssEmployeeService) { }

  @Get()
  async getAll() {
    return this.employeeService.findAll();
  }

  @Get('employee/:id')
  async getEmployeeByBadge(@Param('id') id: number) {
    return await this.employeeService.findOneByBadge(id);
  }

  @Get('search')
  async getByBadge(@Query('badge') badge: string) {
    if (!badge) {
      throw new NotFoundException('Badge is required');
    }

  const numericBadge = badge.split(' ')[0];
    return this.employeeService.findByBadge(Number(numericBadge));
  }
}
