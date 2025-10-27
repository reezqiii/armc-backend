import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { Project } from '../portal_project/project.entity';
import { Department } from '../portal_department/department.entity';
import { Role } from '../portal_master_role_permission_db/role.entity';
import { User } from '../portal/user.entity';
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

    @InjectRepository(User, 'portal')
    private readonly userRepo: Repository<User>,
  ) {}

  /** 🔹 Server-side list with search, sort, and pagination */
  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.project', 'project')
        .leftJoinAndSelect('request.department', 'department')
        .leftJoinAndSelect('request.role', 'role')
        .where('request.status_active = :active', { active: 1 });

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

      // 🔍 Searching
      if (search) {
        let filters: Record<string, any> = {};
        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException('Invalid JSON search format');
        }

        for (const [key, value] of Object.entries(filters)) {
          if (!value) continue;
          const column = columnMap[key];
          if (!column) throw new Error(`Invalid search column: ${key}`);
          qb.andWhere(
            typeof value === 'string'
              ? `CAST(${column} AS TEXT) ILIKE :${key}`
              : `${column} = :${key}`,
            { [key]: typeof value === 'string' ? `%${value}%` : value },
          );
        }
      }

      // 🔽 Sorting
      if (sort) {
        const [col, dir] = sort.split(',');
        const column = columnMap[col] ?? `request.${col}`;
        qb.orderBy(column, (dir?.toUpperCase() as 'ASC' | 'DESC') || 'ASC');
      } else {
        qb.orderBy('request.created_date', 'DESC');
      }

      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      const statusMap: Record<number, string> = {
        0: 'Draft',
        1: 'Pending by HOD',
        2: 'Rejected by HOD',
        3: 'Pending by IT',
        4: 'Rejected by IT',
        5: 'Completed',
      };

      const mappedData = await Promise.all(
        data.map(async (d) => {
          let requestorName = d.created_by?.toString();
          if (d.created_by) {
            const user = await this.userRepo.findOne({
              where: { id_user: d.created_by },
            });
            requestorName = user?.full_name || requestorName;
          }

          return {
            id_request: d.id_request,
            created_date: d.created_date,
            requestor_name: requestorName,
            full_name: d.full_name,
            badge_no: d.badge_no,
            email: d.email,
            project_name: d.project?.project_name || '-',
            department_name: d.department?.name_of_department || '-',
            role_name: d.role?.role_name || '-',
            request_status: {
              name: statusMap[d.request_status] ?? 'Unknown',
            },
          };
        }),
      );

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

  /** 🔹 Get all (without pagination) */
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

  /** 🔹 Get single request by ID */
  async findOne(id: number): Promise<RequestEntity> {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: ['project', 'department', 'role'],
    });
    if (!data) throw new NotFoundException(`Request with ID ${id} not found`);
    return data;
  }

  /** 🔹 Create new request */
  async create(
    data: Partial<RequestEntity>,
    userId: number,
  ): Promise<RequestEntity> {
    const project = data.project
      ? await this.projectRepo.findOne({ where: { id: data.project.id } })
      : null;

    const department = data.department
      ? await this.departmentRepo.findOne({
          where: { id_department: data.department.id_department },
        })
      : null;

    const role = data.role
      ? await this.roleRepo.findOne({ where: { id_role: data.role.id_role } })
      : null;

    const newRequest = this.requestRepo.create({
      full_name: data.full_name,
      badge_no: data.badge_no,
      email: data.email,
      request_reason: data.request_reason,
      project,
      department,
      role,
      request_type: data.request_type ?? 1,
      request_status: data.request_status ?? 0,
      status_active: data.status_active ?? 1,
      created_date: new Date(),
      created_by: userId,
    });

    return this.requestRepo.save(newRequest);
  }

  /** 🔹 Update request */
  async update(
    id_request: number,
    data: Partial<RequestEntity>,
  ): Promise<RequestEntity> {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    Object.assign(existing, data);
    return this.requestRepo.save(existing);
  }

  /** 🔹 Cancel request */
  async cancelRequest(
    id_request: number,
    userId: number,
  ): Promise<RequestEntity> {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    existing.status_active = 0;
    existing.canceled_by = userId;
    existing.canceled_date = new Date();

    return this.requestRepo.save(existing);
  }

  /** 🔹 Delete request */
  async remove(id: number): Promise<void> {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Request with ID ${id} not found`);
  }
}
