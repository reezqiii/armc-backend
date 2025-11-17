import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './request.entity';
import { User } from '../portal_user_db/user.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { IssProject } from 'iss_project/iss_project.entity';
import { IssDept } from 'iss_dept/iss_dept.entity';
import { Position } from 'iss_design_new/position.entity';
import { IssEmployee } from 'iss_employee/employee.entity';
import { EmailService } from '../email/email.service';
import { Company } from 'portal_company/company.entity';
import { NavMenu } from 'portal_nav_menu/menu.entity';
@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(IssProject, 'db_iss')
    private readonly projectRepo: Repository<IssProject>,
    @InjectRepository(IssDept, 'db_iss')
    private readonly departmentRepo: Repository<IssDept>,
    @InjectRepository(Position, 'db_iss')
    private readonly positionRepo: Repository<Position>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(NavMenu)
    private readonly navMenuRepo: Repository<NavMenu>,
    @InjectRepository(IssEmployee, 'db_iss')
    private readonly employeeRepo: Repository<IssEmployee>,
    private readonly mailService: EmailService,
  ) { }

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.approval_hod_by', 'approvalHod')
        .leftJoinAndSelect('request.approval_it_hod_by', 'approvalIt')
        .where('request.status_active = :active', { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: 'request.id_request',
        full_name: 'request.full_name',
        badge_no: 'request.badge_no',
        email: 'request.email',
        request_status: 'request.request_status',
        created_date: 'request.created_date',
        status_active: 'request.status_active',
        approval_hod: 'approvalHod.full_name',
        approval_hod_by: 'approvalHod.id_user',
        approval_it: 'approvalIt.full_name',
        approval_lead_it: 'approvalLeadIt.full_name',
      };

      if (search) {
        let filters: Record<string, any> = {};
        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException('Invalid JSON search format');
        }

        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null) continue;
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
        1: 'Pending by HOD Req',
        2: 'Rejected by HOD Req',
        3: 'Pending by Lead IT',
        4: 'Rejected by Lead IT',
        5: 'Pending by IT Manager',
        6: 'Rejected by IT Manager',
        7: 'Completed',
      };

      const mappedData = await Promise.all(
        data.map(async (d, index) => {
          const runningNumber = total - (skip + index);

          const project = d.project_id
            ? await this.projectRepo.findOne({
              where: { project_id: d.project_id },
            })
            : null;

          const department = d.dept_id
            ? await this.departmentRepo.findOne({
              where: { dept_id: d.dept_id },
            })
            : null;

          const position = d.design_id
            ? await this.positionRepo.findOne({
              where: { design_id: d.design_id },
            })
            : null;

          const company = d.id_company
            ? await this.companyRepo.findOne({
              where: { id_company: d.id_company },
            })
            : null;

          let requestorName = d.created_by?.toString();
          if (d.created_by) {
            const user = await this.userRepo.findOne({
              where: { id_user: d.created_by },
            });
            requestorName = user?.full_name || requestorName;
          }

          return {
            id_request: d.id_request,
            no_request: runningNumber,
            created_date: d.created_date,
            requestor_name: requestorName,
            full_name: d.full_name,
            badge_no: d.badge_no,
            email: d.email,
            company_name: company?.company_name || '-',
            project_name: project?.project_desc || '-',
            department_name: department?.dept || '-',
            position_name: position?.design_desc || '-',
            request_status: {
              name: statusMap[d.request_status] ?? 'Unknown',
            },

            approval_hod: d.approval_hod_by
              ? `${d.approval_hod_by.id_user} - ${d.approval_hod_by.full_name}`
              : '-',

            approval_lead_it: d.approval_lead_it_by
              ? `${d.approval_lead_it_by.id_user} - ${d.approval_lead_it_by.full_name}`
              : '-',

            approval_it: d.approval_it_hod_by
              ? `${d.approval_it_hod_by.id_user} - ${d.approval_it_hod_by.full_name}`
              : '-',

            request_admin: d.request_admin ?? 0,
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

  async findAll(): Promise<any[]> {
    const data = await this.requestRepo.find({ order: { created_date: 'DESC' } });

    return Promise.all(
      data.map(async (d) => {
        const project = d.project_id
          ? await this.projectRepo.findOne({
            where: { project_id: d.project_id },
          })
          : null;

        const department = d.dept_id
          ? await this.departmentRepo.findOne({
            where: { dept_id: d.dept_id },
          })
          : null;

        const position = d.design_id
          ? await this.positionRepo.findOne({
            where: { design_id: d.design_id },
          })
          : null;

        return {
          ...d,
          project_name: project?.project_desc || '',
          department_name: department?.dept || '',
          position_name: position?.design_desc || '',
        };
      }),
    );
  }

  async findOne(id: number): Promise<any> {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: ['approval_hod_by', 'approval_lead_it_by', 'approval_it_hod_by', 'company'],
    });

    if (!data) throw new NotFoundException(`Request with ID ${id} not found`);

    const project = data.project_id
      ? await this.projectRepo.findOne({ where: { project_id: data.project_id } })
      : null;

    const department = data.dept_id
      ? await this.departmentRepo.findOne({ where: { dept_id: data.dept_id } })
      : null;

    const position = data.design_id
      ? await this.positionRepo.findOne({ where: { design_id: data.design_id } })
      : null;

    const createdByUser = data.created_by
      ? await this.userRepo.findOne({ where: { id_user: data.created_by } })
      : null;

    // --- Ambil nama company dari access_yard_company ---
    let yardCompanies = [];
    if (typeof data.access_yard_company === 'string') {
      const ids = data.access_yard_company.split(',').map(id => id.trim());
      yardCompanies = await Promise.all(
        ids.map(async id => {
          const company = await this.companyRepo.findOne({ where: { id_company: Number(id) } });
          return {
            id,
            company_name: company?.company_name || id,
          };
        }),
      );
    }

    let navMenus = [];
    if (data.access_nav_menu) {
      const ids = String(data.access_nav_menu)
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      navMenus = await Promise.all(
        ids.map(async id => {
          const menu = await this.navMenuRepo.findOne({
            where: { id_application: Number(id) },
          });
          return {
            id,
            application_name: menu?.application_name || `Unknown (${id})`,
          };
        }),
      );
    }

    return {
      ...data,
      project_name: project?.project_desc || '-',
      department_name: department?.dept || '-',
      position_name: position?.design_desc || '-',
      created_by_name: createdByUser?.full_name || '-',

      company: data.company
        ? {
          id_company: data.company.id_company,
          company_name: data.company.company_name,
        }
        : null,

      approval_hod_by: data.approval_hod_by
        ? {
          id: data.approval_hod_by.id_user,
          badge_no: data.approval_hod_by.badge_no,
          full_name: data.approval_hod_by.full_name,
        }
        : null,

      approval_it_hod_by: data.approval_it_hod_by
        ? {
          id: data.approval_it_hod_by.id_user,
          badge_no: data.approval_it_hod_by.badge_no,
          full_name: data.approval_it_hod_by.full_name,
        }
        : null,

      approval_lead_it_by: data.approval_lead_it_by
        ? {
          id: data.approval_lead_it_by.id_user,
          badge_no: data.approval_lead_it_by.badge_no,
          full_name: data.approval_lead_it_by.full_name,
        }
        : null,

      access_yard_company: yardCompanies,
      access_nav_menu: navMenus,
    };
  }

  async create(
    data: Partial<RequestEntity>,
    userId: number
  ): Promise<RequestEntity & { created_by_name?: string; no_request?: string }> {

    const employee = await this.employeeRepo.findOne({
      where: { badge: Number(data.badge_no) },
      relations: ['department', 'project', 'position'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with badge ${data.badge_no} not found`);
    }

    const company = await this.companyRepo.findOne({
      where: { id_company: employee.company },
    });

    const accessYardValue = Array.isArray(data.access_yard_company)
      ? data.access_yard_company.join(',')
      : data.access_yard_company || null;

    const accessNavMenuValue = Array.isArray(data.access_nav_menu)
      ? data.access_nav_menu.join(',')
      : data.access_nav_menu || null;

    let approvalHodUser = null;
    if (data.approval_hod_by) {
      approvalHodUser = await this.userRepo.findOne({
        where: {
          id_user: typeof data.approval_hod_by === 'object'
            ? data.approval_hod_by.id_user
            : data.approval_hod_by
        },
      });
    }

    const approvalItUser = data.approval_it_hod_by
      ? await this.userRepo.findOne({
        where: {
          id_user:
            typeof data.approval_it_hod_by === 'object'
              ? data.approval_it_hod_by.id_user
              : data.approval_it_hod_by,
        },
      })
      : null;

    const newRequest = this.requestRepo.create({
      ...data,
      full_name: data.full_name,
      request_reason: data.request_reason,
      email: data.email,
      badge_no: data.badge_no,
      project_id: data.project_id || null,
      dept_id: data.dept_id || null,
      design_id: data.design_id || null,
      company: company || null,
      id_company: company?.id_company || null,
      access_yard_company: accessYardValue,
      access_nav_menu: accessNavMenuValue,
      request_type: data.request_type ?? 1,
      request_status: data.request_status ?? 0,
      status_active: data.status_active ?? 1,
      created_date: new Date(),
      created_by: userId,
      remarks: data.remarks,
      approval_hod_by: approvalHodUser,
      approval_it_hod_by: approvalItUser,
    });

    const savedRequest = await this.requestRepo.save(newRequest);

    const createdByUser = await this.userRepo.findOne({
      where: { id_user: userId },
    });

    return {
      ...savedRequest,
      created_by_name: createdByUser?.full_name || null,
    };
  }

  async getEmployeeByBadge(badge: number) {
    const employee = await this.employeeRepo.findOne({
      where: { badge },
      relations: ['department', 'project', 'position'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with badge ${badge} not found`);
    }

    return {
      badge: employee.badge,
      full_name: employee.name,
      project_id: employee.project?.project_id || null,
      project_name: employee.project?.project_desc || '-',
      dept_id: employee.department?.dept_id || null,
      dept_name: employee.department?.dept || '-',
      design_id: employee.position?.design_id || null,
      position_name: employee.position?.design_desc || '-',
    };
  }

  async getAllHods() {
    try {
      const users = await this.userRepo.find({
        where: { status_user: 1 },
        order: { full_name: 'ASC' },
      });

      return users.map(u => ({
        id_user: u.id_user,
        badge_no: u.badge_no,
        full_name: u.full_name,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch HOD list');
    }
  }

  async update(
    id_request: number,
    data: Partial<RequestEntity>,
  ): Promise<RequestEntity> {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_hod_by', 'approval_lead_it_by', 'approval_it_hod_by'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (data.access_yard_company !== undefined) {
      existing.access_yard_company = Array.isArray(data.access_yard_company)
        ? data.access_yard_company.join(',')
        : data.access_yard_company;
    }

    if (data.access_nav_menu !== undefined) {
      existing.access_nav_menu = Array.isArray(data.access_nav_menu)
        ? data.access_nav_menu.join(',')
        : data.access_nav_menu;
    }

    if (data.approval_hod_by) {
      const hodId = typeof data.approval_hod_by === 'object'
        ? data.approval_hod_by.id_user
        : data.approval_hod_by;

      const userHod = await this.userRepo.findOne({
        where: { id_user: Number(hodId) },
      });
      if (userHod) {
        existing.approval_hod_by = userHod;
        existing.approval_hod_date_at = new Date();
      }
    }

    if (data.approval_lead_it_by) {
      const leadItId = typeof data.approval_lead_it_by === 'object'
        ? data.approval_lead_it_by.id_user
        : data.approval_lead_it_by;

      const userLeadIt = await this.userRepo.findOne({
        where: { id_user: Number(leadItId) },
      });
      if (userLeadIt) {
        existing.approval_lead_it_by = userLeadIt;
        existing.approval_lead_date_at = new Date();
      }
    }

    if (data.approval_it_hod_by) {
      const itId = typeof data.approval_it_hod_by === 'object'
        ? data.approval_it_hod_by.id_user
        : data.approval_it_hod_by;

      const userIt = await this.userRepo.findOne({
        where: { id_user: Number(itId) },
      });
      if (userIt) {
        existing.approval_it_hod_by = userIt;
        existing.approval_it_date_at = new Date();
      }
    }

    if (data.rejected_hod_remarks) {
      existing.rejected_hod_remarks = data.rejected_hod_remarks;
      existing.approval_hod_date_at = new Date();
    }

    if (data.rejected_lead_remarks) {
      existing.rejected_lead_remarks = data.rejected_lead_remarks;
      existing.approval_lead_date_at = new Date();
    }

    if (data.rejected_it_remarks) {
      existing.rejected_it_remarks = data.rejected_it_remarks;
      existing.approval_it_date_at = new Date();
    }

    Object.assign(existing, data);

    return this.requestRepo.save(existing);
  }

  async updateAdminStatus(id_request: number, request_admin: number) {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    existing.request_admin = request_admin;
    await this.requestRepo.save(existing);
  }

  async hodApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number
  ) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_hod_by', 'approval_lead_it_by', 'approval_it_hod_by'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (action === 'approve') {
      existing.request_status = 3;
      existing.approval_hod_date_at = new Date();
      existing.approval_hod_by = await this.userRepo.findOne({ where: { id_user: userId } });
    } else if (action === 'reject') {
      existing.request_status = 2;
      existing.rejected_hod_remarks = remarks;
      existing.approval_hod_date_at = new Date();
      existing.approval_hod_by = await this.userRepo.findOne({ where: { id_user: userId } });
    }
    else {
      throw new InternalServerErrorException('Invalid action');
    }

    return this.requestRepo.save(existing);
  }

  async hodApprovalBulk(ids: number[], action: string, remarks: string, userId: number) {
    const results = [];

    for (const id of ids) {
      const res = await this.hodApproval(id, action, remarks, userId);
      results.push(res);
    }

    return {
      success: true,
      count: results.length,
      message: `Processed ${results.length} requests`,
      results,
    };
  }

  async submitToHod(id_request: number) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_hod_by', 'created_by_user'],
    });

    if (!existing) throw new NotFoundException(`Request with ID ${id_request} not found`);
    if (!existing.approval_hod_by)
      throw new InternalServerErrorException('HOD not assigned for this request');

    existing.request_status = 1;
    const saved = await this.requestRepo.save(existing);

    try {
      await this.mailService.sendHodApprovalEmail({
        to: existing.approval_hod_by.email,
        requestNumber: `ITF14-${String(existing.id_request).padStart(6, '0')}`,
        requestorName: existing.created_by_user?.full_name || 'Unknown User',
        requestDate: existing.created_date?.toISOString().split('T')[0] || '',
        requestDescription: existing.request_reason || '-',
        publicLink: `http://public.smoe.com/request/${existing.id_request}`,
        smoeLink: `http://itportal.smoe.com/approval/${existing.id_request}`,
      });
    } catch (err) {
      console.error('Failed to send HOD email:', err);
    }

    return saved;
  }

  async leadItApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number
  ) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_hod_by', 'approval_lead_it_by', 'approval_it_hod_by'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (action === 'approve') {
      existing.request_status = 5;
      existing.approval_lead_date_at = new Date();
      existing.approval_lead_it_by = await this.userRepo.findOne({
        where: { id_user: userId },
      });
    } else if (action === 'reject') {
      existing.request_status = 4;
      existing.rejected_lead_remarks = remarks;
      existing.approval_lead_date_at = new Date();
      existing.approval_lead_it_by = await this.userRepo.findOne({
        where: { id_user: userId },
      });
    } else {
      throw new InternalServerErrorException('Invalid action');
    }

    return this.requestRepo.save(existing);
  }

  async itApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number
  ) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_it_hod_by', 'approval_lead_it_by', 'approval_hod_by'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (action === 'approve') {
      existing.request_status = 7;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by = await this.userRepo.findOne({ where: { id_user: userId } });
    } else if (action === 'reject') {
      existing.request_status = 6;
      existing.rejected_it_remarks = remarks;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by = await this.userRepo.findOne({ where: { id_user: userId } });
    } else {
      throw new InternalServerErrorException('Invalid action');
    }

    return this.requestRepo.save(existing);
  }

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

  async remove(id: number): Promise<void> {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Request with ID ${id} not found`);
  }
}
