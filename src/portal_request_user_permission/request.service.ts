import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { RequestEntity } from "./request.entity";
import { User } from "../portal_user_db/user.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { EmailService } from "../email/email.service";
import { NavMenu } from "portal_nav_menu/menu.entity";
import { PortalPermission } from "portal_permission/permission.entity";
import { PortalUserPermissionService } from "portal_user_permission/user_permission.service";
import { sendEmailDto } from "email/dto/send-email.dto";
import { AesEcbService } from "crypto/aes-ecb.service";
import { ConfigService } from "@nestjs/config";
import { getStatusLabel } from "utils/status-helper";
import { formatDate } from "utils/format-date";
import * as path from "path";
import { CategoryAccount } from "portal_category_account/entities/portal_category_account.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";

@Injectable()
export class RequestService {
  constructor(
    private readonly aesEcbService: AesEcbService,
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(PortalProject)
    private readonly projectRepo: Repository<PortalProject>,
    @InjectRepository(PortalDepartment)
    private readonly departmentRepo: Repository<PortalDepartment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly permissionService: PortalUserPermissionService,
    @InjectRepository(PortalPermission)
    private readonly portalPermissionRepo: Repository<PortalPermission>,
    @InjectRepository(NavMenu)
    private readonly navMenuRepo: Repository<NavMenu>,
    private readonly mailService: EmailService,
    private configService: ConfigService,
    @InjectRepository(CategoryAccount)
    private readonly categoryRepo: Repository<CategoryAccount>,
  ) {}

  async serverSideList(queryDto: ServerSideDTO, user?: any) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder("request")
        .leftJoinAndSelect("request.category", "category")
        .leftJoinAndSelect("request.approval_hod_by", "approvalHod")
        .leftJoinAndSelect("request.approval_it_hod_by", "approvalIt")
        .leftJoinAndSelect("request.created_by_user", "requestor")
        .where("request.status_active = :active", { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: "request.id_request",
        full_name: "request.full_name",
        badge_no: "request.badge_no",
        email: "request.email",
        requestor_id: "request.created_by",
        requestor: "requestor.full_name",
        request_status: "request.request_status",
        created_date: "request.created_date",
        status_active: "request.status_active",
        requestor_name: "requestor.full_name",
        approval_hod: "approvalHod.full_name",
        approval_hod_by: "approvalHod.id_user",
        approval_it: "approvalIt.full_name",
        category_account: "category.id",
        category_account_name: "category.name",
        dept_id: "request.dept_id",
      };

      const manualSortFields = ["department_name", "project_name"];
      let manualSearchQueue: Array<{ field: string; value: any }> = [];
      let manualSortField: string | null = null;
      let manualSortDir: "ASC" | "DESC" = "ASC";

      if (search) {
        let filters: Record<string, any> = {};
        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException("Invalid JSON search format");
        }

        const manualFields = ["department_name", "project_name"];

        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null) continue;

          if (manualFields.includes(key)) {
            manualSearchQueue.push({ field: key, value });
            continue;
          }

          if (key === "requestor" || key === "requestor_name") {
            qb.andWhere(`requestor.full_name ILIKE :req_name`, {
              req_name: `%${value}%`,
            });
            continue;
          }

          const column = columnMap[key];
          if (!column) continue;

          qb.andWhere(
            typeof value === "string"
              ? `CAST(${column} AS TEXT) ILIKE :${key}`
              : `${column} = :${key}`,
            { [key]: typeof value === "string" ? `%${value}%` : value },
          );
        }
      }

      if (!user.permissions_key?.includes("request.view_all")) {
        qb.andWhere(
          "(request.created_by = :uid OR request.approval_hod_by = :uid)",
          { uid: user.id_user },
        );
      }

      if (sort) {
        const [sortField, sortDirRaw] = sort.split(",");
        const sortDir = sortDirRaw?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        if (manualSortFields.includes(sortField)) {
          manualSortField = sortField;
          manualSortDir = sortDir;
        } else {
          const column = columnMap[sortField] ?? `request.${sortField}`;
          qb.orderBy(column, sortDir);
        }
      } else {
        qb.orderBy("request.created_date", "DESC");
      }

      const hasManualFilter = manualSearchQueue.length > 0;
      const hasManualSort = !!manualSortField;

      let data: any[];
      let totalCount: number;

      if (hasManualFilter || hasManualSort) {
        [data, totalCount] = await qb.getManyAndCount();
      } else {
        [data, totalCount] = await qb.skip(skip).take(take).getManyAndCount();
      }

      const projects = await this.projectRepo.find();
      const departments = await this.departmentRepo.find();

      const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
      const departmentMap = Object.fromEntries(
        departments.map((d) => [d.id_department, d]),
      );

      let mappedData = data.map((d) => {
        const project = projectMap[d.project_id];
        const department = departmentMap[d.dept_id];
        const requestorName = d.created_by_user?.full_name || "-";

        const categoryName =
          d.category?.name || (d.category_account != null ? null : null) || "-";

        return {
          id_request: d.id_request,
          created_date: d.created_date,
          created_by_name: requestorName,
          full_name: d.full_name,
          badge_no: d.badge_no,
          email: d.email,
          project_name: project?.project_name || "-",
          department_name: department?.name_of_department || "-",
          request_status: d.request_status,
          request_status_name: getStatusLabel(
            "request_status",
            d.request_status,
          ),
          category_account: d.category?.id ?? d.category_account,
          category_account_name: d.category?.name || "-",
          approval_hod_by: d.approval_hod_by
            ? {
                id: d.approval_hod_by.id_user,
                badge_no: d.approval_hod_by.badge_no,
                full_name: d.approval_hod_by.full_name,
              }
            : null,
          approval_hod_date_at: d.approval_hod_date_at || null,
          rejected_hod_remarks: d.rejected_hod_remarks || null,
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
      });

      for (const { field, value } of manualSearchQueue) {
        const searchValue = String(value).toLowerCase();
        mappedData = mappedData.filter((item) =>
          String(item[field] ?? "")
            .toLowerCase()
            .includes(searchValue),
        );
      }

      if (manualSortField) {
        const direction = manualSortDir === "DESC" ? -1 : 1;
        mappedData.sort(
          (a, b) =>
            String(a[manualSortField] ?? "").localeCompare(
              String(b[manualSortField] ?? ""),
            ) * direction,
        );
      }

      const filteredTotal =
        hasManualFilter || hasManualSort ? mappedData.length : totalCount;

      const paginatedData =
        hasManualFilter || hasManualSort
          ? mappedData.slice(skip, skip + take)
          : mappedData;

      const finalData = paginatedData.map((item, index) => ({
        ...item,
        no_request: skip + index + 1,
      }));

      return {
        data: finalData,
        total_records: filteredTotal,
        total_pages: Math.ceil(filteredTotal / take),
        page,
        size: take,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<any[]> {
    const data = await this.requestRepo.find({
      order: { created_date: "DESC" },
    });

    if (data.length === 0) return [];

    const projectIds = Array.from(
      new Set(data.map((d) => d.project_id).filter((id) => id != null)),
    );
    const deptIds = Array.from(
      new Set(data.map((d) => d.dept_id).filter((id) => id != null)),
    );

    const [projects, departments] = await Promise.all([
      projectIds.length > 0
        ? this.projectRepo.find({ where: { id: In(projectIds) } })
        : [],
      deptIds.length > 0
        ? this.departmentRepo.find({ where: { id_department: In(deptIds) } })
        : [],
    ]);

    const projectMap = new Map<number, string>();
    for (const p of projects) projectMap.set(p.id, p.project_name);

    const deptMap = new Map<number, string>();
    for (const d of departments)
      deptMap.set(d.id_department, d.name_of_department);

    return data.map((d) => ({
      ...d,
      project_name: projectMap.get(d.project_id) ?? "-",
      department_name: deptMap.get(d.dept_id) ?? "-",
    }));
  }

  async findOne(id: number): Promise<any> {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: ["approval_hod_by", "approval_it_hod_by", "category"],
    });

    if (!data) throw new NotFoundException(`Request with ID ${id} not found`);

    const project = data.project_id
      ? await this.projectRepo.findOne({ where: { id: data.project_id } })
      : null;

    const department = data.dept_id
      ? await this.departmentRepo.findOne({
          where: { id_department: data.dept_id },
        })
      : null;

    const createdByUser = data.created_by
      ? await this.userRepo.findOne({ where: { id_user: data.created_by } })
      : null;

    const category =
      data.category_account != null
        ? await this.categoryRepo.findOne({
            where: { id: Number(data.category_account) },
          })
        : null;

    return {
      id_request: data.id_request,
      created_date: data.created_date,
      created_by: data.created_by,
      created_by_name: createdByUser?.full_name || null,
      full_name: data.full_name,
      badge_no: data.badge_no,
      email: data.email,
      request_reason: data.request_reason,
      remarks: data.remarks,
      request_status: data.request_status,
      status_active: data.status_active,
      dept_id: data.dept_id,
      project_id: data.project_id,
      canceled_by: data.canceled_by,
      canceled_date: data.canceled_date,
      rejected_hod_remarks: data.rejected_hod_remarks,
      rejected_it_remarks: data.rejected_it_remarks,
      project: project?.project_name || null,
      project_name: project?.project_name || null,
      department: department?.name_of_department || null,
      department_name: department?.name_of_department || null,
      category: data.category
        ? { id: data.category.id, name: data.category.name }
        : null,
      category_account: data.category_account,
      category_account_name: data.category?.name || category?.name || "-",
      approval_hod_by: data.approval_hod_by
        ? {
            id: data.approval_hod_by.id_user,
            full_name: data.approval_hod_by.full_name,
            badge_no: data.approval_hod_by.badge_no,
          }
        : null,
      approval_hod_date_at: data.approval_hod_date_at || null,
      approval_it_hod_by: data.approval_it_hod_by
        ? {
            id: data.approval_it_hod_by.id_user,
            full_name: data.approval_it_hod_by.full_name,
            badge_no: data.approval_it_hod_by.badge_no,
          }
        : null,
      approval_it_date_at: data.approval_it_date_at || null,

      access_nav_menu: await this.getNavMenuList(data.access_nav_menu),
    };
  }

  private async getNavMenuList(access: string): Promise<any[]> {
    if (!access) return [];
    const ids = String(access)
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    return Promise.all(
      ids.map(async (id) => {
        const menu = await this.navMenuRepo.findOne({
          where: { id_application: id },
        });
        return {
          id,
          application_name: menu?.application_name || `Unknown (${id})`,
        };
      }),
    );
  }

  async create(
    data: Partial<RequestEntity>,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const badgeInput = data.badge_no?.toString().trim();

    const accessNavMenuValue = Array.isArray(data.access_nav_menu)
      ? data.access_nav_menu.join(",")
      : data.access_nav_menu || null;

    let approvalHodUser = null;
    if (data.approval_hod_by) {
      const hodId =
        typeof data.approval_hod_by === "object"
          ? (data.approval_hod_by as any).id_user
          : data.approval_hod_by;

      approvalHodUser = await this.userRepo.findOne({
        where: { id_user: hodId as number },
      });
    }

    const newRequest = this.requestRepo.create({
      ...data,
      full_name: data.full_name,
      request_reason: data.request_reason,
      email: data.email,
      position: data.position,
      badge_no: badgeInput,
      project_id: data.project_id || null,
      dept_id: data.dept_id || null,
      access_nav_menu: accessNavMenuValue,
      request_status: data.request_status ?? 1,
      status_active: data.status_active ?? 1,
      created_date: new Date(),
      created_by: userId,
      remarks: data.remarks,
      category_account: data.category_account,
      approval_hod_by: approvalHodUser,
      approval_it_hod_by: null,
    });

    const savedRequest = await this.requestRepo.save(newRequest);

    const fullRequest = await this.requestRepo.findOne({
      where: { id_request: savedRequest.id_request },
      relations: ["approval_hod_by", "created_by_user", "category"],
    });

    if (fullRequest && fullRequest.approval_hod_by) {
      try {
        await this.notifyHod(fullRequest);
      } catch (mailErr) {
      
        console.warn("Notification to HOD failed:", mailErr.message);
      }
    }

    return {
      success: true,
      message: "Request created successfully and HOD has been notified",
    };
  }

  async update(
    id_request: number,
    data: Partial<RequestEntity>,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ["approval_hod_by", "approval_it_hod_by", "category"],
    });

    if (!existing) {
      throw new NotFoundException(`Request with ID ${id_request} not found`);
    }

    if (existing.request_status !== 1) {
      throw new BadRequestException(
        "Request cannot be updated because it is already in process",
      );
    }

    delete data.request_status;
    delete data.approval_hod_by;
    delete data.approval_it_hod_by;
    delete data.approval_hod_date_at;
    delete data.approval_it_date_at;
    delete data.rejected_hod_remarks;
    delete data.rejected_it_remarks;

    if (data.access_nav_menu !== undefined) {
      existing.access_nav_menu = Array.isArray(data.access_nav_menu)
        ? data.access_nav_menu.join(",")
        : data.access_nav_menu;
    }

    if (data.approval_hod_by) {
      const hodId =
        typeof data.approval_hod_by === "object"
          ? data.approval_hod_by.id_user
          : data.approval_hod_by;

      const userHod = await this.userRepo.findOne({
        where: { id_user: Number(hodId) },
      });

      if (userHod) existing.approval_hod_by = userHod;
    }

    const {
      approval_hod_by,
      approval_it_hod_by,
      access_nav_menu,
      ...safeData
    } = data;

    Object.assign(existing, safeData);
    await this.requestRepo.save(existing);

    return {
      success: true,
      message: "Request updated successfully",
    };
  }

  async hodApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number,
  ) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ["approval_hod_by", "created_by_user", "category"],
    });
    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);
    if (existing.request_status !== 1)
      throw new BadRequestException("Request is not pending HOD approval");

    const hodUser = await this.userRepo.findOne({ where: { id_user: userId } });
    if (!hodUser) throw new BadRequestException("Invalid HOD user");
    if (existing.dept_id !== hodUser.department) {
      throw new ForbiddenException(
        "You can only approve requests from your own department",
      );
    }

    existing.approval_hod_date_at = new Date();
    existing.approval_hod_by = hodUser;

    if (action === "approve") {
      existing.request_status = 5;
      await this.requestRepo.save(existing);
      await this.notifyItApproval(existing.id_request);
    } else if (action === "reject") {
      existing.request_status = 2;
      existing.rejected_hod_remarks = remarks;
      await this.requestRepo.save(existing);
    } else {
      throw new InternalServerErrorException("Invalid action");
    }

    return true;
  }

  async hodApprovalBulk(
    encryptedIds: string[],
    action: string,
    remarks: string,
    userId: number,
  ) {
    if (!Array.isArray(encryptedIds))
      throw new BadRequestException("encryptedIds must be an array");

    const approvedRequests = [];
    const hodUser = await this.userRepo.findOne({ where: { id_user: userId } });
    if (!hodUser) throw new BadRequestException("Invalid HOD user");

    for (const encryptedId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encryptedId));
      const existing = await this.requestRepo.findOne({
        where: { id_request: id },
        relations: ["approval_hod_by", "created_by_user", "category"],
      });

      if (!existing) continue;
      if (existing.request_status !== 1) continue;
      if (existing.dept_id !== hodUser.department) continue;

      existing.approval_hod_date_at = new Date();
      existing.approval_hod_by = hodUser;

      if (action === "approve") {
        existing.request_status = 5;
        await this.requestRepo.save(existing);
        approvedRequests.push(existing);
      } else if (action === "reject") {
        existing.request_status = 2;
        existing.rejected_hod_remarks = remarks;
        await this.requestRepo.save(existing);
      }
    }

    for (const req of approvedRequests) {
      await this.notifyItApproval(req.id_request);
    }

    return {
      success: true,
      count: approvedRequests.length,
      message: `Processed ${approvedRequests.length} requests`,
    };
  }

  private async notifyHod(request: any) {
    const hod = request.approval_hod_by;
    if (!hod?.email) {
      console.warn("HOD email not found, skipping notification");
      return;
    }

    const encryptedId = this.aesEcbService.encryptToBase64Url(String(request.id_request));
    const approvalLink = `${process.env.ARMC_BASE_URL}/user_request/detail_req/${encryptedId}`;
    const requestNumber = `REQ-${String(request.id_request).padStart(6, "0")}`;

    const viewData = {
      approverName: hod.full_name,
      categoryAccount: request.category?.name || "-",
      requestNumber,
      requestDate: request.created_date ? new Date(request.created_date).toLocaleDateString("en-GB") : "-",
      requestorName: request.created_by_user?.full_name || "-",
      targetBadgeNo: request.badge_no || "-",
      targetFullName: request.full_name || "-",
      targetEmail: request.email || "-",
      requestDescription: request.request_reason || "-",
      approvalLink,
    };

    const htmlContent = this.mailService.renderTemplate("approval.ejs", viewData);

    const dynamicSubject = `${requestNumber} - Request Pending Your Approval [${Date.now()}]`;

    await this.mailService.sendSimpleEmail(
      hod.email,
      dynamicSubject,
      htmlContent,
    );
  }

  private async notifyItApproval(id_request: number) {
    const request = await this.requestRepo.findOne({
      where: { id_request },
      relations: ["created_by_user", "category"],
    });

    if (!request) return;

    const portalEmails = await this.mailService.getPortalEmailList({
      process: "IT Manager Approval",
      group_name: 24,
    });

    const encryptedId = this.aesEcbService.encryptToBase64Url(String(request.id_request));
    const requestNumber = `REQ-${String(request.id_request).padStart(6, "0")}`;
    const approvalLink = `${process.env.ARMC_BASE_URL}/user_request/detail_req/${encryptedId}`;

    const emailTo: string[] = [];
    portalEmails.forEach((row) => {
      if (row.email_to) emailTo.push(...row.email_to.split(",").map((v) => v.trim()).filter((v) => v));
    });

    const viewData = {
      approverName: "HOD IT",
      categoryAccount: request.category?.name || "-",
      requestNumber: requestNumber,
      requestDate: request.created_date ? new Date(request.created_date).toLocaleDateString("en-GB") : "-",
      requestorName: request.created_by_user?.full_name || "-",
      targetBadgeNo: request.badge_no || "-",
      targetFullName: request.full_name || "-",
      targetEmail: request.email || "-",
      requestDescription: request.request_reason || "-",
      approvalLink,
    };

    const htmlContent = this.mailService.renderTemplate("approval.ejs", viewData);
    
    const dynamicSubject = `${requestNumber} - Action Required: IT HOD Approval [${Date.now()}]`;

    await this.mailService.sendSimpleEmail(
      emailTo.join(","),
      dynamicSubject,
      htmlContent,
    );
  }

  async itApproval(
    id_request: number,
    action: string,
    remarks: string,
    userId: number,
  ) {
    const existing = await this.requestRepo.findOne({
      where: { id_request },
      relations: ["approval_it_hod_by", "approval_hod_by", "category"],
    });

    if (!existing)
      throw new NotFoundException(`Request with ID ${id_request} not found`);
    if (existing.request_status !== 5)
      throw new BadRequestException("Request is not pending IT approval");

    const itUser = await this.userRepo.findOne({ where: { id_user: userId } });

    if (action === "approve") {
      existing.request_status = 7;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by = itUser;
    } else if (action === "reject") {
      existing.request_status = 6;
      existing.rejected_it_remarks = remarks;
      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by = itUser;
    } else {
      throw new InternalServerErrorException("Invalid action");
    }

    return this.requestRepo.save(existing);
  }

  async itApprovalBulk(
    encryptedIds: string[],
    action: "approve" | "reject",
    remarks: string,
    userId: number,
  ) {
    if (!Array.isArray(encryptedIds))
      throw new BadRequestException("encryptedIds must be an array");

    const itUser = await this.userRepo.findOne({ where: { id_user: userId } });
    if (!itUser) throw new BadRequestException("Invalid IT user");

    const approvedRequests = [];

    for (const encId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encId));
      if (isNaN(id)) continue;

      const existing = await this.requestRepo.findOne({
        where: { id_request: id },
      });
      if (!existing) continue;
      if (existing.request_status !== 5) continue;

      existing.approval_it_date_at = new Date();
      existing.approval_it_hod_by = itUser;

      if (action === "approve") {
        existing.request_status = 7;
        approvedRequests.push(existing);
      } else if (action === "reject") {
        existing.request_status = 6;
        existing.rejected_it_remarks = remarks;
      }

      await this.requestRepo.save(existing);
    }

    return {
      success: true,
      count: approvedRequests.length,
      message: `Processed ${approvedRequests.length} IT approvals`,
    };
  }

  async exportList(filters: any, sort_by: string, sort_order: string) {
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] === null ||
          filters[key] === undefined ||
          filters[key] === ""
        )
          delete filters[key];
      });
    }

    const qb = this.requestRepo
      .createQueryBuilder("r")
      .select("r")
      .leftJoin("portal_user_db", "u", "u.id_user = r.created_by")
      .addSelect(["u.full_name"])
      .leftJoin("master_category_account", "cat", "cat.id = r.category_account")
      .addSelect(["cat.name"]);

    if (filters && Object.keys(filters).length > 0) {
      const exactMatchFields: Record<string, string> = {
        request_status: "r.request_status",
        requestor_id: "r.created_by",
        dept_id: "r.dept_id",
        id_request: "r.id_request",
      };

      const likeFields: Record<string, string> = {
        requestor_name: "u.full_name",
        full_name: "r.full_name",
        email: "r.email",
        badge_no: "r.badge_no",
      };

      for (const key in exactMatchFields) {
        if (
          filters[key] !== undefined &&
          filters[key] !== "" &&
          filters[key] !== null
        ) {
          qb.andWhere(`${exactMatchFields[key]} = :${key}`, {
            [key]: filters[key],
          });
        }
      }

      for (const key in likeFields) {
        if (filters[key]) {
          qb.andWhere(`LOWER(${likeFields[key]}) LIKE :${key}`, {
            [key]: `%${filters[key].toLowerCase()}%`,
          });
        }
      }

      if (filters.created_date) {
        qb.andWhere(`EXTRACT(DAY FROM r.created_date) = :created_day`, {
          created_day: Number(filters.created_date),
        });
      }

      if (filters.department_name) {
        const depts = await this.departmentRepo
          .createQueryBuilder("d")
          .where("LOWER(d.name_of_department) LIKE :name", {
            name: `%${filters.department_name.toLowerCase()}%`,
          })
          .getMany();

        const deptIds = depts.map((d) => d.id_department);
        if (deptIds.length > 0) {
          qb.andWhere("r.dept_id IN (:...deptIds)", { deptIds });
        } else {
          qb.andWhere("1=0");
        }
      }

      if (filters.project_name) {
        const projects = await this.projectRepo
          .createQueryBuilder("p")
          .where("LOWER(p.project_name) LIKE :name", {
            name: `%${filters.project_name.toLowerCase()}%`,
          })
          .getMany();

        const projectIds = projects.map((p) => p.id);
        if (projectIds.length > 0) {
          qb.andWhere("r.project_id IN (:...projectIds)", { projectIds });
        } else {
          qb.andWhere("1=0");
        }
      }

      if (filters.keyword) {
        const keyword = `%${filters.keyword.toLowerCase()}%`;
        qb.andWhere(
          `(LOWER(r.full_name) LIKE :keyword OR LOWER(r.email) LIKE :keyword OR
          LOWER(r.badge_no) LIKE :keyword OR LOWER(u.full_name) LIKE :keyword)`,
          { keyword },
        );
      }
    }

    if (sort_by) {
      const sortColumnMap: Record<string, string> = {
        category_account_name: "cat.name",
        requestor_name: "u.full_name",
        department_name: "r.dept_id",
        project_name: "r.project_id",
      };
      const sortColumn = sortColumnMap[sort_by] ?? `r.${sort_by}`;
      qb.orderBy(
        sortColumn,
        sort_order?.toUpperCase() === "DESC" ? "DESC" : "ASC",
      );
    } else {
      qb.orderBy("r.created_date", "DESC");
    }

    const requests = await qb.getRawMany();

    const [depts, projects] = await Promise.all([
      this.departmentRepo.find(),
      this.projectRepo.find(),
    ]);

    const deptMap = new Map(
      depts.map((d) => [d.id_department, d.name_of_department]),
    );
    const projectMap = new Map(projects.map((p) => [p.id, p.project_name]));

    return requests.map((r) => ({
      ...r,
      department_name: deptMap.get(r.r_dept_id) || "-",
      project_name: projectMap.get(r.r_project_id) || "-",
      requestor_name: r.u_full_name || "-",
    }));
  }

  async cancelRequest(
    id_request: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.requestRepo.findOne({
      where: { id_request, status_active: 1 },
    });

    if (!existing) {
      throw new NotFoundException(
        `Request with ID ${id_request} not found or already inactive`,
      );
    }

    if (existing.created_by !== userId) {
      throw new ForbiddenException(
        "You are not authorized to cancel this request",
      );
    }

    if (existing.request_status !== 1) {
      throw new BadRequestException(
        "Cannot cancel request that is already being processed or approved",
      );
    }

    existing.status_active = 0;
    existing.request_status = 0;
    existing.canceled_by = userId;
    existing.canceled_date = new Date();

    await this.requestRepo.save(existing);

    return {
      success: true,
      message: "Request has been successfully canceled",
    };
  }

  async getLatestPeriod() {
    const result = await this.requestRepo
      .createQueryBuilder("r")
      .select("MAX(r.created_date)", "max")
      .where("r.status_active = :active", { active: 1 })
      .getRawOne();

    if (!result?.max) return null;
    const date = new Date(result.max);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  async getSummary(month: any, year: number) {
    const baseQuery = this.requestRepo
      .createQueryBuilder("r")
      .where("r.status_active = :active", { active: 1 });

    if (month && month !== "all" && month !== "null") {
      const m = Number(month);
      baseQuery.andWhere("r.created_date BETWEEN :start AND :end", {
        start: new Date(year, m - 1, 1),
        end: new Date(year, m, 0, 23, 59, 59),
      });
    } else {
      baseQuery.andWhere("r.created_date BETWEEN :start AND :end", {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31, 23, 59, 59),
      });
    }

    const [total, pending, rejected, approved, rawRequests] = await Promise.all(
      [
        baseQuery.getCount(),
        baseQuery
          .clone()
          .andWhere("r.request_status IN (:...s)", { s: [1, 5] })
          .getCount(),
        baseQuery
          .clone()
          .andWhere("r.request_status IN (:...s)", { s: [2, 6] })
          .getCount(),
        baseQuery
          .clone()
          .andWhere("r.request_status = :s", { s: 7 })
          .getCount(),
        baseQuery
          .clone()
          .select(["r.id_request", "r.dept_id", "r.request_status"])
          .getMany(),
      ],
    );

    const allDepts = await this.departmentRepo.find({
      select: ["id_department", "name_of_department"],
    });

    const deptMap = new Map<
      string,
      { count: number; pending: number; approved: number }
    >();

    rawRequests.forEach((req) => {
      const dept = allDepts.find((d) => d.id_department === req.dept_id);
      const name = dept ? dept.name_of_department : "Unknown Dept";

      const current = deptMap.get(name) ?? {
        count: 0,
        pending: 0,
        approved: 0,
      };

      deptMap.set(name, {
        count: current.count + 1,
        pending:
          current.pending + ([1, 5].includes(req.request_status) ? 1 : 0),
        approved: current.approved + (req.request_status === 7 ? 1 : 0),
      });
    });

    return {
      total,
      pending,
      rejected,
      approved,
      deptStats: Array.from(deptMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getAnalyticsByDept(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const deptStats = await this.requestRepo
      .createQueryBuilder("r")
      .leftJoin("portal_department", "d", "r.dept_id = d.id_department")
      .select("d.name_of_department", "label")
      .addSelect("COUNT(r.id_request)", "value")
      .where("r.created_date BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      })
      .groupBy("d.name_of_department")
      .getRawMany();

    return { deptStats };
  }

  async remove(id: number): Promise<void> {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Request with ID ${id} not found`);
  }
}
