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
import { AesEcbService } from "crypto/aes-ecb.service";
import { getStatusLabel } from "utils/status-helper";
import { CategoryAccount } from "portal_category_account/entities/portal_category_account.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { Position } from "portal_position/entities/portal_position.entity";

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
    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NavMenu)
    private readonly navMenuRepo: Repository<NavMenu>,
    private readonly mailService: EmailService,
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
        .leftJoinAndSelect("request.project", "project")
        .leftJoinAndSelect("request.department", "department")
        .leftJoinAndSelect("request.position", "position")
        .leftJoinAndSelect("request.application", "application")
        .where("request.status_active = :active", { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: "request.id_request",
        full_name: "request.full_name",
        badge_no: "request.badge_no",
        email: "request.email",
        request_status: "request.request_status",
        created_date: "request.created_date",
        category_account_name: "category.category_name",
        department_name: "department.name_of_department",
        project_name: "project.project_name",
        position_name: "position.position_name",
        application_name: "application.application_name",
      };

      if (search) {
        let filters: Record<string, any> = {};
        try {
          filters = JSON.parse(search);
        } catch {
          throw new InternalServerErrorException("Invalid JSON search format");
        }

        for (const [key, value] of Object.entries(filters)) {
          if (!value) continue;
          const column = columnMap[key] ?? `request.${key}`;
          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        qb.orderBy(
          columnMap[field] ?? `request.${field}`,
          dir.toUpperCase() as any,
        );
      } else {
        qb.orderBy("request.id_request", "DESC");
      }

      const [data, totalCount] = await qb
        .skip(skip)
        .take(take)
        .getManyAndCount();

      const finalData = data.map((d, index) => ({
        no_request: skip + index + 1,
        id_request: d.id_request,
        created_by_name: d.created_by_user?.full_name || "-",
        full_name: d.full_name,
        badge_no: d.badge_no,
        email: d.email,
        position_name: d.position?.position_name || "-",
        project_name: d.project?.project_name || "-",
        department_name: d.department?.name_of_department || "-",
        application_name: d.application?.application_name || "-",
        request_status: d.request_status,
        request_status_name: getStatusLabel("request_status", d.request_status),
        category_account_name: d.category?.category_name || "-",
        approval_hod_name: d.approval_hod_by?.full_name || "-",
        approval_it_name: d.approval_it_hod_by?.full_name || "-",
      }));

      return {
        data: finalData,
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / take),
        page,
        size: take,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number): Promise<any> {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: [
        "approval_hod_by",
        "approval_it_hod_by",
        "category",
        "project",
        "department",
        "position",
        "application",
        "created_by_user",
      ],
    });

    if (!data) throw new NotFoundException(`Request with ID ${id} not found`);

    return {
      ...data,
      created_by_name: data.created_by_user?.full_name || null,
      position_name: data.position?.position_name || null,
      project_name: data.project?.project_name || null,
      department_name: data.department?.name_of_department || null,
      category_account_name: data.category?.category_name || "-",
      application_name: data.application?.application_name || "-",
    };
  }

  async create(
    data: Partial<RequestEntity>,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const newRequest = this.requestRepo.create({
      ...data,
      created_by: userId,
      status_active: 1,
      request_status: 1,
    });

    const savedRequest = await this.requestRepo.save(newRequest);
    const fullRequest = await this.findOne(savedRequest.id_request);

    if (fullRequest.approval_hod_by_id) {
      this.notifyHod(fullRequest).catch((err) =>
        console.error("HOD Notify Error:", err.message),
      );
    }

    return { success: true, message: "Request created successfully" };
  }

  async update(
    id_request: number,
    data: Partial<RequestEntity>,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing) throw new NotFoundException("Request not found");

    Object.assign(existing, data);
    await this.requestRepo.save(existing);
    return { success: true, message: "Request updated successfully" };
  }

  async hodApprovalBulk(
    encryptedIds: string[],
    action: string,
    remarks: string,
    userId: number,
  ) {
    const hodUser = await this.userRepo.findOne({ where: { id_user: userId } });
    const approvedIds = [];

    for (const encId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encId));
      const existing = await this.requestRepo.findOne({
        where: { id_request: id, request_status: 1 },
      });

      if (existing) {
        existing.approval_hod_by_id = userId;
        if (action === "approve") {
          existing.request_status = 3;
          approvedIds.push(id);
        } else {
          existing.request_status = 2;
          existing.rejected_hod_remarks = remarks;
        }
        await this.requestRepo.save(existing);
      }
    }

    for (const id of approvedIds) {
      this.notifyItApproval(id).catch((err) =>
        console.error("IT Notify Error:", err.message),
      );
    }
    return {
      success: true,
      message: `Processed ${encryptedIds.length} requests`,
    };
  }

  async itApprovalBulk(
    encryptedIds: string[],
    action: "approve" | "reject",
    remarks: string,
    userId: number,
  ) {
    for (const encId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encId));
      const existing = await this.requestRepo.findOne({
        where: { id_request: id, request_status: 3 },
      });

      if (existing) {
        existing.approval_it_hod_by_id = userId;
        if (action === "approve") {
          existing.request_status = 5;
        } else {
          existing.request_status = 4;
          existing.rejected_it_remarks = remarks;
        }
        await this.requestRepo.save(existing);
      }
    }
    return { success: true, message: "IT Approval processed successfully" };
  }

  async exportList(filters: any, sort_by?: string, sort_order?: string) {
    const qb = this.requestRepo
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.category", "category")
      .leftJoinAndSelect("request.project", "project")
      .leftJoinAndSelect("request.department", "department")
      .leftJoinAndSelect("request.position", "position")
      .leftJoinAndSelect("request.application", "application")
      .leftJoinAndSelect("request.created_by_user", "requestor")
      .where("request.status_active = :active", { active: 1 });

    if (filters) {
      // Implementasi filter export sesuai kebutuhan ExcelController
      if (filters.request_status)
        qb.andWhere("request.request_status = :status", {
          status: filters.request_status,
        });
    }

    return qb.orderBy("request.id_request", "DESC").getMany();
  }

  async getLatestPeriod() {
    const result = await this.requestRepo
      .createQueryBuilder("r")
      .select("MAX(r.created_date)", "max")
      .getRawOne();
    if (!result?.max) return null;
    const date = new Date(result.max);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  async getSummary(month: any, year: number) {
    const qb = this.requestRepo
      .createQueryBuilder("r")
      .where("r.status_active = 1");

    if (month && month !== "all") {
      qb.andWhere(
        "EXTRACT(MONTH FROM r.created_date) = :m AND EXTRACT(YEAR FROM r.created_date) = :y",
        { m: month, y: year },
      );
    }

    const [total, pending, rejected, completed] = await Promise.all([
      qb.getCount(),
      qb.clone().andWhere("r.request_status IN (1, 3)").getCount(),
      qb.clone().andWhere("r.request_status IN (0, 2, 4)").getCount(),
      qb.clone().andWhere("r.request_status = 5").getCount(),
    ]);

    return { total, pending, rejected, completed };
  }

  private async notifyHod(request: any) {
    const hod = request.approval_hod_by;
    if (!hod?.email) return;
    const encryptedId = this.aesEcbService.encryptToBase64Url(
      String(request.id_request),
    );
    const viewData = {
      approverName: hod.full_name,
      categoryAccount: request.category_account_name,
      requestNumber: `REQ-${String(request.id_request).padStart(6, "0")}`,
      requestorName: request.created_by_name,
      targetFullName: request.full_name,
      approvalLink: `${process.env.ARMC_BASE_URL}/user_request/detail_req/${encryptedId}`,
    };
    const html = this.mailService.renderTemplate("approval.ejs", viewData);
    await this.mailService.sendSimpleEmail(
      hod.email,
      `Approval Required - ${viewData.requestNumber}`,
      html,
    );
  }

  private async notifyItApproval(id_request: number) {
    const itHodUsers = await this.userRepo.find({
      where: { id_department: 1, id_role: 2 },
    });
    const emails = itHodUsers
      .map((u) => u.email)
      .filter((e) => !!e)
      .join(",");
    if (!emails) return;

    const request = await this.findOne(id_request);
    const viewData = {
      approverName: "HOD IT",
      categoryAccount: request.category_account_name,
      requestNumber: `REQ-${String(id_request).padStart(6, "0")}`,
      requestorName: request.created_by_name,
      targetFullName: request.full_name,
      approvalLink: `${process.env.ARMC_BASE_URL}/user_request/detail_req/${this.aesEcbService.encryptToBase64Url(String(id_request))}`,
    };
    const html = this.mailService.renderTemplate("approval.ejs", viewData);
    await this.mailService.sendSimpleEmail(
      emails,
      `IT HOD Approval Required - ${viewData.requestNumber}`,
      html,
    );
  }

  async cancelRequest(id_request: number, userId: number) {
    const existing = await this.requestRepo.findOne({
      where: { id_request, created_by: userId, status_active: 1 },
    });
    if (!existing) throw new NotFoundException("Request not found");
    existing.status_active = 0;
    existing.canceled_by = userId;
    return this.requestRepo.save(existing);
  }

  async remove(id: number): Promise<void> {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Request with ID ${id} not found`);
  }
}
