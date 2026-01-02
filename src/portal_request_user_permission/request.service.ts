import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException
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
import { PortalPermission } from 'portal_permission/permission.entity';
import { PortalUserPermissionService } from 'portal_user_permission/user_permission.service';
import { sendEmailDto } from 'email/dto/send-email.dto';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { ConfigService } from "@nestjs/config";
import { LogPortalService } from 'log_portal/log_portal.service';

@Injectable()
export class RequestService {
  private PORTAL_LINK: string
  constructor(
    private readonly aesEcbService: AesEcbService,
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
    private readonly permissionService: PortalUserPermissionService,
    @InjectRepository(PortalPermission)
    private readonly portalPermissionRepo: Repository<PortalPermission>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(NavMenu)
    private readonly navMenuRepo: Repository<NavMenu>,
    @InjectRepository(IssEmployee, 'db_iss')
    private readonly employeeRepo: Repository<IssEmployee>,
    private readonly mailService: EmailService,
    private configService: ConfigService,
    private readonly logPortalService: LogPortalService,
  ) {
    this.PORTAL_LINK = this.configService.get<string>("LINK_PORTAL");
  }

  async serverSideList(queryDto: ServerSideDTO, user?: any) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = size;
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.approval_hod_by', 'approvalHod')
        .leftJoinAndSelect('request.approval_it_hod_by', 'approvalIt')
        .leftJoinAndSelect('request.approval_lead_it_by', 'approvalLeadIt')
        .leftJoinAndSelect('request.created_by_user', 'requestor')
        .leftJoinAndSelect('request.company', 'company')
        .where('request.status_active = :active', { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: 'request.id_request',
        full_name: 'request.full_name',
        badge_no: 'request.badge_no',
        email: 'request.email',
        requestor_id: 'request.created_by',
        request_status: 'request.request_status',
        created_date: 'request.created_date',
        status_active: 'request.status_active',
        request_admin: 'request.request_admin',
        requestor_name: 'requestor.full_name',
        company_name: 'company.company_name',
        approval_hod: 'approvalHod.full_name',
        approval_hod_by: 'approvalHod.id_user',
        approval_it: 'approvalIt.full_name',
        approval_lead_it: 'approvalLeadIt.full_name',
        category_account: 'request.category_account',
      };

      const manualSortFields = [
        'department_name',
        'project_name',
        'position_name',
      ];

      let manualSearchQueue: Array<{ field: string; value: any }> = [];
      let manualSortField: string | null = null;
      let manualSortDir: 'ASC' | 'DESC' = 'ASC';

      if (search) {
        let filters: Record<string, any> = {};

        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException('Invalid JSON search format');
        }

        const manualFields = ['department_name', 'project_name', 'position_name'];

        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null) continue;

          if (manualFields.includes(key)) {
            manualSearchQueue.push({ field: key, value });
            continue;
          }

          const column = columnMap[key];
          if (!column) continue;

          qb.andWhere(
            typeof value === 'string'
              ? `CAST(${column} AS TEXT) ILIKE :${key}`
              : `${column} = :${key}`,
            { [key]: typeof value === 'string' ? `%${value}%` : value },
          );
        }
      }

      if (!user.permissions.includes(2)) {
        qb.andWhere('(request.created_by = :uid OR request.approval_hod_by = :uid)', { uid: user.id_user });
      }

      if (sort) {
        const [sortField, sortDirRaw] = sort.split(',');
        const sortDir = sortDirRaw?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        if (manualSortFields.includes(sortField)) {
          manualSortField = sortField;
          manualSortDir = sortDir;
        } else {
          const column = columnMap[sortField] ?? `request.${sortField}`;
          qb.orderBy(column, sortDir);
        }
      } else {
        qb.orderBy('request.created_date', 'DESC');
      }

      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      let mappedData = await Promise.all(
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

          let requestorName = null;
          if (d.created_by) {
            const user = await this.userRepo.findOne({ where: { id_user: d.created_by } });
            requestorName = user?.full_name || null;
          }

          // const btnCancel = [0, 1, 2].includes(d.request_status) || user.permissions.includes(2);
          // const btnEdit = [0, 1, 2].includes(d.request_status) || user.permissions.includes(2);


          return {
            id_request: d.id_request,
            no_request: runningNumber,
            created_date: d.created_date,
            requestor_name: requestorName,
            full_name: d.full_name,
            badge_no: d.badge_no,
            email: d.email,
            type: d.type,
            company_name: company?.company_name || '-',
            project_name: project?.project_desc || '-',
            department_name: department?.dept || '-',
            position_name: position?.design_desc || '-',
            request_status: d.request_status,
            previous_status: d.previous_status,
            category_account: d.category_account,
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

            approval_hod_by: d.approval_hod_by
              ? {
                id: d.approval_hod_by.id_user,
                badge_no: d.approval_hod_by.badge_no,
                full_name: d.approval_hod_by.full_name,
              }
              : null,

            approval_hod_date_at: d.approval_hod_date_at || null,
            rejected_hod_remarks: d.rejected_hod_remarks || null,

            approval_lead_it_by: d.approval_lead_it_by
              ? {
                id: d.approval_lead_it_by.id_user,
                badge_no: d.approval_lead_it_by.badge_no,
                full_name: d.approval_lead_it_by.full_name,
              }
              : null,

            approval_lead_date_at: d.approval_lead_date_at || null,
            rejected_lead_remarks: d.rejected_lead_remarks || null,

            approval_it_hod_by: d.approval_it_hod_by
              ? {
                id: d.approval_it_hod_by.id_user,
                badge_no: d.approval_it_hod_by.badge_no,
                full_name: d.approval_it_hod_by.full_name,
              }
              : null,

            approval_it_date_at: d.approval_it_date_at || null,
            rejected_it_remarks: d.rejected_it_remarks || null,

          };
        })
      );

      for (const { field, value } of manualSearchQueue) {
        const searchValue = String(value).toLowerCase();

        mappedData = mappedData.filter(item => {
          const target = String(item[field] ?? '').toLowerCase();
          return target.includes(searchValue);
        });
      }

      if (manualSortField) {
        const direction = manualSortDir === 'DESC' ? -1 : 1;

        mappedData.sort((a, b) => {
          const A = a[manualSortField] ?? '';
          const B = b[manualSortField] ?? '';
          return A.localeCompare(B) * direction;
        });
      }

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

    return {
      ...data,

      project: project ? project.project_desc : null,
      project_name: project ? project.project_desc : null,
      department: department ? department.dept : null,
      department_name: department ? department.dept : null,
      position: position ? position.design_desc : null,
      position_name: position ? position.design_desc : null,
      created_by_name: createdByUser ? createdByUser.full_name : null,
      category_account: data.category_account,
      company: data.company ? {
        id_company: data.company.id_company,
        company_name: data.company.company_name
      } : null,
      approval_hod_by: data.approval_hod_by
        ? {
          id: data.approval_hod_by.id_user,
          full_name: data.approval_hod_by.full_name,
          badge_no: data.approval_hod_by.badge_no,
        }
        : null,
      approval_it_hod_by: data.approval_it_hod_by
        ? {
          id: data.approval_it_hod_by.id_user,
          full_name: data.approval_it_hod_by.full_name,
          badge_no: data.approval_it_hod_by.badge_no,
        }
        : null,
      approval_lead_it_by: data.approval_lead_it_by
        ? {
          id: data.approval_lead_it_by.id_user,
          full_name: data.approval_lead_it_by.full_name,
          badge_no: data.approval_lead_it_by.badge_no,
        }
        : null,
      access_yard_company: await this.getYardCompanyList(data.access_yard_company),
      access_nav_menu: await this.getNavMenuList(data.access_nav_menu),

    };
  }

  async findPublicTrack(id_request: number) {
    const data = await this.requestRepo.findOne({
      where: {
        id_request,
        type: 1,
        created_by: null,
        status_active: 1,
      },
      relations: ['company'],
    });

    if (!data) {
      throw new NotFoundException('Public request not found');
    }

    const department = data.dept_id
      ? await this.departmentRepo.findOne({
        where: { dept_id: data.dept_id },
      })
      : null;

    const project = data.project_id
      ? await this.projectRepo.findOne({
        where: { project_id: data.project_id },
      })
      : null;

    const position = data.design_id
      ? await this.positionRepo.findOne({
        where: { design_id: data.design_id },
      })
      : null;

    return {
      ...data,
      request_status: data.request_status,
      department_name: department?.dept ?? '-',
      project_name: project?.project_desc ?? '-',
      position_name: position?.design_desc ?? '-',
    };
  }

  private async getNavMenuList(access: string): Promise<any[]> {
    if (!access) return [];

    const ids = String(access)
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id));

    return Promise.all(
      ids.map(async id => {
        const menu = await this.navMenuRepo.findOne({ where: { id_application: id } });
        return {
          id,
          application_name: menu?.application_name || `Unknown (${id})`,
        };
      }),
    );
  }

  private async getYardCompanyList(access: string): Promise<any[]> {
    if (!access) return [];

    const ids = String(access)
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id));

    return Promise.all(
      ids.map(async id => {
        const company = await this.companyRepo.findOne({ where: { id_company: id } });
        return {
          id,
          company_name: company?.company_name || `Unknown (${id})`,
        };
      }),
    );
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
      type: 0,
      remarks: data.remarks,
      category_account: data.category_account,
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

  async createPublic(data: Partial<RequestEntity>): Promise<RequestEntity> {
    const company = await this.companyRepo.findOne({
      where: { id_company: data.id_company || null },
    });

    const accessYardValue = Array.isArray(data.access_yard_company)
      ? data.access_yard_company.join(',')
      : data.access_yard_company || null;

    const accessNavMenuValue = Array.isArray(data.access_nav_menu)
      ? data.access_nav_menu.join(',')
      : data.access_nav_menu || null;

    // Ambil User entity jika ada approval_lead_it_by
    let approvalLeadItUser: User | null = null;
    if (data.approval_lead_it_by) {
      approvalLeadItUser = await this.userRepo.findOne({
        where: { id_user: Number(data.approval_lead_it_by) }
      });
    }

    const newRequest = this.requestRepo.create({
      full_name: data.full_name,
      request_reason: data.request_reason,
      email: data.email,
      badge_no: data.badge_no ? String(data.badge_no) : null,
      project_id: data.project_id ? Number(data.project_id) : null,
      dept_id: data.dept_id ? Number(data.dept_id) : null,
      design_id: data.design_id ? Number(data.design_id) : null,
      id_company: data.id_company ? Number(data.id_company) : null,
      company: company || null,
      access_yard_company: accessYardValue,
      access_nav_menu: accessNavMenuValue,
      request_type: data.request_type ?? 1,
      request_status: data.request_status ?? 0,
      status_active: data.status_active ?? 1,
      created_date: new Date(),
      created_by: null, // publik
      type: 1,
      remarks: data.remarks,
      approval_hod_by: null,
      approval_it_hod_by: null,
      approval_lead_it_by: approvalLeadItUser,
    });

    return this.requestRepo.save(newRequest);

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

    // handle yard company
    if (data.access_yard_company !== undefined) {
      existing.access_yard_company = Array.isArray(data.access_yard_company)
        ? data.access_yard_company.join(',')
        : data.access_yard_company;
    }

    // handle nav menu
    if (data.access_nav_menu !== undefined) {
      existing.access_nav_menu = Array.isArray(data.access_nav_menu)
        ? data.access_nav_menu.join(',')
        : data.access_nav_menu;
    }

    // approval HOD
    if (data.approval_hod_by) {
      const hodId = typeof data.approval_hod_by === 'object'
        ? data.approval_hod_by.id_user
        : data.approval_hod_by;

      const parsedId = Number(hodId);

      if (!parsedId || isNaN(parsedId)) {

      } else {
        const userHod = await this.userRepo.findOne({ where: { id_user: parsedId } });
        if (userHod) {
          existing.approval_hod_by = userHod;
          // existing.approval_hod_date_at = new Date();
        }
      }
    }

    // approval Lead IT
    if (data.approval_lead_it_by) {
      const leadItId = typeof data.approval_lead_it_by === 'object'
        ? data.approval_lead_it_by.id_user
        : data.approval_lead_it_by;

      const parsedId = Number(leadItId);

      if (!parsedId || isNaN(parsedId)) {

      } else {
        const userLeadIt = await this.userRepo.findOne({ where: { id_user: parsedId } });
        if (userLeadIt) {
          existing.approval_lead_it_by = userLeadIt;
          existing.approval_lead_date_at = new Date();
        }
      }
    }

    // approval IT HOD
    if (data.approval_it_hod_by) {
      const itId = typeof data.approval_it_hod_by === 'object'
        ? data.approval_it_hod_by.id_user
        : data.approval_it_hod_by;

      const parsedId = Number(itId);

      if (!parsedId || isNaN(parsedId)) {

      } else {
        const userIt = await this.userRepo.findOne({
          where: { id_user: parsedId },
        });

        if (userIt) {
          existing.approval_it_hod_by = userIt;
          existing.approval_it_date_at = new Date();
        }
      }
    }

    // rejected notes
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

    const { design_id, ...rest } = data;

    if (design_id !== undefined) {
      existing.design_id = Number(design_id);
    }

    if (data.category_account !== undefined) {
      existing.category_account = data.category_account;
    }

    // hapus field yg tidak boleh assign langsung
    delete rest.approval_hod_by;
    delete rest.approval_lead_it_by;
    delete rest.approval_it_hod_by;
    delete rest.access_yard_company;
    delete rest.access_nav_menu;

    // assign sisa tanpa menimpa design_id
    Object.assign(existing, rest);

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
      relations: ['approval_hod_by', 'created_by_user'],
    });

    if (!existing) {
      throw new NotFoundException(`Request with ID ${id_request} not found`);
    }

    if (existing.request_status !== 1) {
      throw new BadRequestException('Request is not pending HOD approval');
    }

    const hodUser = await this.userRepo.findOne({
      where: { id_user: userId },
    });

    if (!hodUser) {
      throw new BadRequestException('Invalid HOD user');
    }

    existing.previous_status = existing.request_status;
    existing.approval_hod_by = hodUser;
    existing.approval_hod_date_at = new Date();

    if (action === 'approve') {
      existing.request_status = 3;
      await this.requestRepo.save(existing);

      await this.notifyLeadItApproval(existing.id_request);

    } else if (action === 'reject') {
      existing.request_status = 2;
      existing.rejected_hod_remarks = remarks;
      await this.requestRepo.save(existing);

    } else {
      throw new InternalServerErrorException('Invalid action');
    }

    return true;
  }

  async hodApprovalBulk(
    ids: number[],
    action: string,
    remarks: string,
    userId: number
  ) {
    const approvedRequests = [];

    for (const id of ids) {
      const existing = await this.requestRepo.findOne({
        where: { id_request: id },
        relations: ['approval_hod_by', 'created_by_user'],
      });

      if (!existing) continue;
      if (existing.request_status !== 1) continue;

      const hodUser = await this.userRepo.findOne({
        where: { id_user: userId },
      });

      if (!hodUser) {
        throw new BadRequestException('Invalid HOD user');
      }

      existing.previous_status = existing.request_status;
      existing.approval_hod_by = hodUser;
      existing.approval_hod_date_at = new Date();

      if (action === 'approve') {
        existing.request_status = 3;
        await this.requestRepo.save(existing);
        approvedRequests.push(existing);

      } else if (action === 'reject') {
        existing.request_status = 2;
        existing.rejected_hod_remarks = remarks;
        await this.requestRepo.save(existing);
      }
    }

    for (const req of approvedRequests) {
      await this.notifyLeadItApproval(req.id_request);
    }

    return {
      success: true,
      count: approvedRequests.length,
      message: `Processed ${approvedRequests.length} requests`,
    };
  }

  async submitToHod(encryptedId: string, userId: number) {
    const decrypted = this.aesEcbService.decryptBase64Url(encryptedId);
    const id_request = Number(decrypted);

    if (!decrypted || isNaN(id_request)) {
      throw new BadRequestException("Invalid encrypted request ID");
    }

    const saved = await this.submitToHodInternal(id_request, userId);

    try {
      await this.notifyHod(saved);
    } catch (err) {
      console.error('Failed to send HOD email:', err);
    }

    return saved;
  }

  private async submitToHodInternal(id_request: number, userId: number) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_hod_by', 'created_by_user'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (!existing.approval_hod_by)
      throw new InternalServerErrorException('HOD not assigned for this request');

    // hanya update status, TANPA email
    existing.request_status = 1;

    return this.requestRepo.save(existing);
  }

  private async notifyHod(request: any) {
    const hod = request.approval_hod_by;

    const encryptedId =
      this.aesEcbService.encryptToBase64Url(
        String(request.id_request)
      );

    const targetUrl =
      `http://localhost:3001/user_request/detail_req/${encryptedId}`;

    const encryptedTarget =
      this.aesEcbService.encryptToBase64Url(targetUrl);

    const approvalLink =
      `${process.env.LINK_PORTAL}/jump_url/redirect_v2/${encryptedTarget}`;

    const viewData = {
      approverName: hod.full_name,
      requestNumber: `ITF14-${String(request.id_request).padStart(6, '0')}`,
      requestDate: request.created_date
        ? new Date(request.created_date).toLocaleDateString('en-GB')
        : '-',
      requestorName: request.created_by_user?.full_name || '-',
      targetBadgeNo: request.badge_no || '-',
      targetFullName: request.full_name || '-',
      targetEmail: request.email || '-',
      requestDescription: request.request_reason || '-',
      approvalLink,
    };

    const email = new sendEmailDto();
    email.email_to = [hod.email];
    email.subject = 'Request Need Your Approval';
    email.content = this.mailService.renderTemplate('approval.ejs', viewData);

    await this.mailService.sendEmail(email);
  }

  async notifyLeadItApproval(id_request: number) {
    const request = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['created_by_user'],
    });

    if (!request) return;

    const portalEmails = await this.mailService.getPortalEmailList({
      process: 'IT Lead Approval',
    });

    const encryptedId =
      this.aesEcbService.encryptToBase64Url(
        String(request.id_request)
      );

    const targetUrl =
      `http://localhost:3001/user_request/detail_req/${encryptedId}`;

    const encryptedTarget =
      this.aesEcbService.encryptToBase64Url(targetUrl);

    const approvalLink =
      `${process.env.LINK_PORTAL}/jump_url/redirect_v2/${encryptedTarget}`;

    const emailTo = [];
    portalEmails.forEach(row => {
      if (row.email_to) {
        emailTo.push(
          ...row.email_to
            .split(",")
            .map(v => v.trim())
            .filter(v => v)
        );
      }
    });

    const viewData = {
      approverName: 'Lead IT Approver',
      requestNumber: `ITF14-${String(request.id_request).padStart(6, '0')}`,
      requestDate: request.created_date
        ? new Date(request.created_date).toLocaleDateString('en-GB')
        : '-',
      requestorName: request.created_by_user?.full_name || '-',
      targetBadgeNo: request.badge_no || '-',
      targetFullName: request.full_name || '-',
      targetEmail: request.email || '-',
      requestDescription: request.request_reason || '-',
      approvalLink:
        `${process.env.LINK_PORTAL}/jump_url/redirect_v2/${encryptedTarget}`
    };

    const email = new sendEmailDto();
    email.email_to = [...new Set(emailTo)];
    email.subject = 'Request Need Lead IT Approval';
    email.content = this.mailService.renderTemplate('approval.ejs', viewData);

    await this.mailService.sendEmail(email);
  }

  async notifyItManagerApproval(id_request: number) {
    const request = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['created_by_user'],
    });

    if (!request) return;

    const portalEmails = await this.mailService.getPortalEmailList({
      process: 'IT Manager Approval',
    });

    const emailTo: string[] = [];
    portalEmails.forEach(row => {
      if (row.email_to) {
        emailTo.push(
          ...row.email_to
            .split(',')
            .map(v => v.trim())
            .filter(v => v)
        );
      }
    });

    if (!emailTo.length) {
      console.warn('No IT Manager email configured');
      return;
    }

    const encryptedId =
      this.aesEcbService.encryptToBase64Url(
        String(request.id_request)
      );

    const targetUrl =
      `http://localhost:3001/user_request/detail_req/${encryptedId}`;

    const encryptedTarget =
      this.aesEcbService.encryptToBase64Url(targetUrl);

    const approvalLink =
      `${process.env.LINK_PORTAL}/jump_url/redirect_v2/${encryptedTarget}`;

    const viewData = {
      approverName: 'IT Manager',
      requestNumber: `ITF14-${String(request.id_request).padStart(6, '0')}`,
      requestDate: request.created_date
        ? new Date(request.created_date).toLocaleDateString('en-GB')
        : '-',
      requestorName: request.created_by_user?.full_name || '-',
      targetBadgeNo: request.badge_no || '-',
      targetFullName: request.full_name || '-',
      targetEmail: request.email || '-',
      requestDescription: request.request_reason || '-',
      approvalLink,
    };

    const email = new sendEmailDto();
    email.email_to = [...new Set(emailTo)];
    email.subject = 'Request Need IT Manager Approval';
    email.content =
      this.mailService.renderTemplate('approval.ejs', viewData);

    await this.mailService.sendEmail(email);
  }

  async submitBulkToHod(encryptedIds: string[], userId: number) {
    return this.requestRepo.manager.transaction(async manager => {
      const results = [];
      const hodMap = new Map<number, any[]>();

      for (const encId of encryptedIds) {
        const decrypted = this.aesEcbService.decryptBase64Url(encId);
        const id_request = Number(decrypted);
        if (isNaN(id_request)) continue;

        const existing = await manager.findOne(RequestEntity, {
          where: { id_request },
          relations: ['approval_hod_by', 'created_by_user'],
        });

        if (!existing || !existing.approval_hod_by) continue;

        existing.request_status = 1;
        const saved = await manager.save(existing);
        results.push(saved);

        const hodId = saved.approval_hod_by.id_user;
        if (!hodMap.has(hodId)) hodMap.set(hodId, []);
        hodMap.get(hodId).push(saved);
      }

      for (const [, requests] of hodMap) {
        for (const req of requests) {
          await this.notifyHod(req);
        }
      }

      return {
        success: true,
        count: results.length,
      };
    });
  }

  async leadItApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number
  ) {
    const permissions =
      await this.permissionService.getUserPermissionsForApp(userId, 31);

    const leadItPermissions = permissions
      .filter(p => p.index_key === '0')
      .map(p => p.id_portal_permission);

    if (!leadItPermissions.includes("2000")) {
      throw new ForbiddenException("Not allowed to approve as Lead IT");
    }

    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['created_by_user'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (existing.request_status !== 3) {
      throw new BadRequestException('Request is not pending Lead IT approval');
    }

    if (action === 'approve') {
      existing.previous_status = existing.request_status;
      existing.request_status = 5;
      existing.approval_lead_date_at = new Date();
      existing.approval_lead_it_by = await this.userRepo.findOne({
        where: { id_user: userId },
      });

      await this.requestRepo.save(existing);

      await this.notifyItManagerApproval(existing.id_request);

    } else if (action === 'reject') {
      existing.previous_status = existing.request_status;
      existing.request_status = 4;
      existing.rejected_lead_remarks = remarks;
      existing.approval_lead_date_at = new Date();
      existing.approval_lead_it_by = await this.userRepo.findOne({
        where: { id_user: userId },
      });

      await this.requestRepo.save(existing);
    } else {
      throw new InternalServerErrorException('Invalid action');
    }

    return true;
  }

  async itApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number
  ) {
    const permissions =
      await this.permissionService.getUserPermissionsForApp(userId, 31);

    const itManagerPermissions = permissions
      .filter(p => p.index_key === '1')
      .map(p => p.id_portal_permission);

    if (!itManagerPermissions.includes("2001")) {
      throw new ForbiddenException("Not allowed to approve as IT Manager");
    }

    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ['approval_it_hod_by', 'approval_lead_it_by', 'approval_hod_by'],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);

    if (existing.request_status !== 5) {
      throw new BadRequestException(
        'Request is not pending IT Manager approval'
      );
    }

    if (action === 'approve') {
      existing.previous_status = existing.request_status;
      existing.request_status = 7;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by =
        await this.userRepo.findOne({ where: { id_user: userId } });
      existing.request_admin = 0;

    } else if (action === 'reject') {
      existing.previous_status = existing.request_status;
      existing.request_status = 4;
      existing.rejected_it_remarks = remarks;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by =
        await this.userRepo.findOne({ where: { id_user: userId } });

    } else {
      throw new InternalServerErrorException('Invalid action');
    }

    return this.requestRepo.save(existing);
  }

  async return(id_request: number, user: any) {
    if (!user.permissions.includes(2)) {
      throw new UnauthorizedException('Forbidden');
    }

    const request = await this.requestRepo.findOne({
      where: { id_request },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (![3, 5, 7].includes(request.request_status)) {
      throw new BadRequestException('Request cannot be returned');
    }

    request.previous_status = request.request_status;

    request.request_status = 8;

    return this.requestRepo.save(request);
  }

  async submitReturn(id: number, userId: number) {
    const request = await this.requestRepo.findOneBy({ id_request: id });
    if (!request) throw new NotFoundException('Request not found');

    if (request.request_status !== 8) {
      throw new BadRequestException('Request is not in Returned status');
    }

    if (request.created_by !== userId) {
      throw new ForbiddenException('You are not allowed to submit this return request');
    }

    request.request_status = request.previous_status ?? request.request_status;
    await this.requestRepo.save(request);

    return { message: 'Return request submitted successfully', request_status: request.request_status };
  }

  async exportList(filters: any, sort_by: string, sort_order: string) {
    const qb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoin('portal_user_db', 'u', 'u.id_user = r.created_by')
      .addSelect(['u.full_name'])
      .leftJoin('portal_company', 'c', 'c.id_company = r.id_company')
      .addSelect(['c.company_name']);

    Object.keys(filters || {}).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {

        if (key === 'request_status' || key === 'request_admin') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            qb.andWhere(`r.${key} = :${key}`, { [key]: numValue });
          }
        }
        if (key === 'category_account') {
          qb.andWhere('r.category_account = :category_account', {
            category_account: Number(value),
          });
        }
        else if (isNaN(Number(value))) {
          qb.andWhere(`r.${key} ILIKE :${key}`, { [key]: `%${value}%` });
        }
        else {
          qb.andWhere(`r.${key} = :${key}`, { [key]: Number(value) });
        }
      }
    });

    qb.orderBy(`r.${sort_by || 'id_request'}`, (sort_order || 'ASC') as 'ASC' | 'DESC');

    const requests = await qb.getRawMany();

    const [depts, positions, projects] = await Promise.all([
      this.departmentRepo.find(),
      this.positionRepo.find(),
      this.projectRepo.find(),
    ]);

    const deptMap = new Map(depts.map(d => [d.dept_id, d.dept]));
    const positionMap = new Map(positions.map(p => [p.design_id, p.design_desc]));
    const projectMap = new Map(projects.map(p => [p.project_id, p.project_desc]));

    return requests.map(r => ({
      ...r,
      department_name: deptMap.get(r.r_dept_id) || '-',
      position_name: positionMap.get(r.r_design_id) || '-',
      project_name: projectMap.get(r.r_project_id) || '-',
      category_account: r.r_category_account,
    }));
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
