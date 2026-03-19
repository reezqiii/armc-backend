import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssEmployee } from './employee.entity';
import { Company } from '../portal_company/company.entity';

@Injectable()
export class IssEmployeeService {
  constructor(
    @InjectRepository(IssEmployee)
    private readonly employeeRepo: Repository<IssEmployee>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) { }

  async findAll(): Promise<any[]> {
    try {
      const employees = await this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .leftJoinAndSelect('e.project', 'p')
        .leftJoinAndSelect('e.position', 'pos')
        .where('e.status = :status', { status: 0 })
        .getMany();
      const companyIds = [...new Set(employees.map(emp => emp.company).filter(Boolean))];

      const companies = await this.companyRepo
        .createQueryBuilder('c')
        .where('c.id_company IN (:...ids)', { ids: companyIds })
        .getMany();

      return employees.map(emp => {
        const comp = companies.find(c => c.id_company === emp.company);
        return {
          badge_no: emp.badge,
          full_name: emp.name,
          department_name: emp.department?.dept || null,
          project_name: emp.project?.project_desc || null,
          position_name: emp.position?.design_desc || null,
          id_position: emp.position?.design_id || null,
          company_name: comp?.company_name || emp['company'] || null,
          id_company: comp?.id_company || null,
        };
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  async findByBadge(badge: string): Promise<any> {
    try {
      const employee = await this.employeeRepo
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.department', 'd')
        .leftJoinAndSelect('e.project', 'p')
        .leftJoinAndSelect('e.position', 'pos')
        .where('e.status = :status', { status: 0 })
        .andWhere(
          '(CAST(e.badge AS TEXT) ILIKE :badge OR e.name ILIKE :name)',
          { badge: `%${badge}%`, name: `%${badge}%` },
        )
        .limit(10)
        .getMany();

      if (!employee) {
        throw new NotFoundException(`Employee with badge ${badge} not found`);
      }

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
        .andWhere('e.status = :status', { status: 0 })
        .getOne();

      if (!employee) {
        throw new NotFoundException(`Employee with badge ${badge} not found`);
      }

      const company = await this.companyRepo.findOne({
        where: { id_company: employee.company },
      });

      return {
        ...employee,
        company_name: company?.company_name ?? '-',
        id_company: company?.id_company ?? employee.company,
      };

    } catch (error) {
      console.error(`Error fetching employee by badge ${badge}:`, error);
      throw error;
    }
  }
}
