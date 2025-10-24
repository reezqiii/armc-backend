import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { RequestEntity } from './request.entity';
import { Project } from '../portal_project/project.entity';
import { Department } from '../portal_department/department.entity';
import { Role } from '../portal_master_role_permission_db/role.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) { }

  /** Server-side pagination, search, sort */
  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.project', 'project')
        .leftJoinAndSelect('request.department', 'department')
        .leftJoinAndSelect('request.role', 'role');

      qb.where('request.status_active = :active', { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: 'request.id_request',
        full_name: 'request.full_name',
        badge_no: 'request.badge_no',
        email: 'request.email',
        project_name: 'project.project_name',
        department_name: 'department.name_of_department',
        role_name: 'role.role_name',
        request_status: 'request.request_status',
        created_date: 'request.created_date',
        status_active: 'request.status_active', 
      };

      // Searching
      if (search) {
        let filters: Record<string, any> = {};
        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException('invalid JSON search format');
        }

        Object.entries(filters).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') return;
          const column = columnMap[key];
          if (!column) throw new Error(`Invalid search column: ${key}`);
          if (typeof value === 'string') {
            qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, { [key]: `%${value}%` });
          } else {
            qb.andWhere(`${column} = :${key}`, { [key]: value });
          }
        });
      }

      // Sorting
      if (sort) {
        const [col, dir] = sort.split(',');
        const column = columnMap[col] ?? `request.${col}`;
        qb.orderBy(column, dir?.toUpperCase() as 'ASC' | 'DESC');
      } else {
        qb.orderBy('request.created_date', 'DESC');
      }

      const [data, total] = await qb.getManyAndCount();

      const statusMap: Record<number, string> = {
        0: 'Draft',
        1: 'Pending by HOD',
        2: 'Rejected HOD',
        3: 'Pending by IT',
        4: 'Rejected IT',
        5: 'Completed',
      };

      const mappedData = data.map((d) => ({
        id_request: d.id_request,
        created_date: d.created_date,
        full_name: d.full_name,
        badge_no: d.badge_no,
        email: d.email,
        project_name: d.project?.project_name || '-',
        department_name: d.department?.name_of_department || '-',
        role_name: d.role?.role_name || '-',
        request_status: {
          name: statusMap[d.request_status] ?? 'Unknown',
        },
      }));

      return {
        data: mappedData,
        total_records: total,
        total_pages: Math.ceil(total / take),
        page,
        size: take,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /** Simple get all (tanpa pagination) */
  async findAll(): Promise<any[]> {
    const data = await this.requestRepo.find({
      relations: ['project', 'department', 'role'],
      order: { created_date: 'DESC' },
    });

    return data.map((d) => ({
      ...d,
      project_name: d.project?.project_name || '',
      department_name: d.department?.name_of_department || '',
      role_name: d.role?.role_name || '',
    }));
  }

  async findOne(id: number): Promise<RequestEntity> {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: ['project', 'department', 'role'],
    });
    if (!data) throw new NotFoundException(`Request with ID ${id} was not found`);
    return data;
  }

  async create(data: Partial<RequestEntity>): Promise<RequestEntity> {
    const project = data.project
      ? await this.projectRepo.findOne({ where: { id: data.project.id } })
      : null;
    const department = data.department
      ? await this.departmentRepo.findOne({ where: { id_department: data.department.id_department } })
      : null;
    const role = data.role
      ? await this.roleRepo.findOne({ where: { id_role: data.role.id_role } })
      : null;
    const full_name = data.full_name;
    const badge_no = data.badge_no;
    const email = data.email;
    const request_reason = data.request_reason;

    const newRequest = this.requestRepo.create({
      full_name,
      request_reason,
      badge_no,
      email,
      project,
      department,
      role,
      request_type: data.request_type ?? 1,
      request_status: data.request_status ?? 0,
      status_active: data.status_active ?? 1,
      created_date: new Date(),
    });

    return await this.requestRepo.save(newRequest);

  }

  async update(id_request: number, data: Partial<RequestEntity>): Promise<RequestEntity> {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing) throw new NotFoundException(`Request with ID ${id_request} was not found`);

    Object.assign(existing, data);
    return this.requestRepo.save(existing);
  }

  async remove(id: number): Promise<void> {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Request with ID ${id} was not found`);
  }
}
