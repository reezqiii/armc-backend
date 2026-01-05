import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssEmployee } from './employee.entity';
import { IssEmployeeService } from './employee.service';
import { IssEmployeeController } from './employee.controller';
import { IssDept } from '../iss_dept/iss_dept.entity';
import { IssProject } from '../iss_project/iss_project.entity';
import { Position } from '../iss_design_new/position.entity';
import { Company } from '../portal_company/company.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [IssEmployee, IssDept, IssProject, Position],
      'db_iss'
    ),
    TypeOrmModule.forFeature([Company]), 
  ],
  providers: [IssEmployeeService],
  controllers: [IssEmployeeController],
  exports: [IssEmployeeService],
})
export class IssEmployeeModule {}
