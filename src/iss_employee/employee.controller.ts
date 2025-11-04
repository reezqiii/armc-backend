import { Controller, Get, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { IssEmployeeService } from './employee.service';

@Controller('iss_employee')
export class IssEmployeeController {
  constructor(private readonly employeeService: IssEmployeeService) {}

  @Get()
  async getAll() {
    return this.employeeService.findAll();
  }

  @Get('search')
  async getByBadge(@Query('badge', ParseIntPipe) badge?: number) {
    if (!badge) {
      throw new NotFoundException('Badge is required');
    }
    return this.employeeService.findByBadge(badge);
  }
}
