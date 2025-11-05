import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssEmployee } from './employee.entity';

@Injectable()
export class IssEmployeeService {
  constructor(
    @InjectRepository(IssEmployee, 'db_iss')
    private readonly employeeRepo: Repository<IssEmployee>,
  ) { }

  async findAll(): Promise<any[]> {
    try {
      const employees = await this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .leftJoinAndSelect('e.project', 'p')
        .leftJoinAndSelect('e.position', 'pos')
        .getMany();

      return employees.map(emp => ({
        badge_no: emp.badge,
        full_name: emp.name,
        department_name: emp.department?.dept || null,
        project_name: emp.project?.project_desc || null,
        position_name: emp.position?.design_desc || null,
        id_position: emp.position?.design_id || null,
      }));

    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async findByBadge(badge: number): Promise<any> {
    try {
      const employee = await this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .leftJoinAndSelect('e.project', 'p')
        .leftJoinAndSelect('e.position', 'pos')
        .where('CAST(e.badge AS TEXT) ILIKE :badge', { badge: `%${badge}%` })
        .limit(10)
        .getMany();

      if (!employee) {
        throw new NotFoundException(`Employee with badge ${badge} not found`);
      }

      // return {
      //   badge_no: employee.badge,
      //   full_name: employee.name,
      //   department_name: employee.department?.dept || null,
      //   project_name: employee.project?.project_desc || null,
      //   position_name: employee.position?.design_desc || null,
      //   department_id: employee.department?.dept_id || null,
      //   project_id: employee.project?.project_id || null,
      //   id_position: employee.position?.design_id || null,
      // };

      return employee

    } catch (error) {
      console.error(`Error fetching employee by badge ${badge}:`, error);
      throw error;
    }
  }

  async findOneByBadge(badge: number): Promise<any> {
    try {
      const employee = await this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .leftJoinAndSelect('e.project', 'p')
        .leftJoinAndSelect('e.position', 'pos')
        .where('e.badge = :badge', { badge })
        .getOne();

      if (!employee) {
        throw new NotFoundException(`Employee with badge ${badge} not found`);
      }

      // return {
      //   badge_no: employee.badge,
      //   full_name: employee.name,
      //   department_name: employee.department?.dept || null,
      //   project_name: employee.project?.project_desc || null,
      //   position_name: employee.position?.design_desc || null,
      //   department_id: employee.department?.dept_id || null,
      //   project_id: employee.project?.project_id || null,
      //   id_position: employee.position?.design_id || null,
      // };

      console.log('Found employee:', employee);

      return employee

    } catch (error) {
      console.error(`Error fetching employee by badge ${badge}:`, error);
      throw error;
    }
  }
}
