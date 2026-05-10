import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestEntity } from "./request.entity";
import { User } from "../portal_user_db/user.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { EmailService } from "../email/email.service";
import { AesEcbService } from "crypto/aes-ecb.service";

@Injectable()
export class RequestService {
  constructor(
    private readonly aesEcbService: AesEcbService,
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: EmailService,
  ) {}

  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { page = 0, size = 10, search, sort } = queryDto;
      const take = Number(size);
      const skip = page * take;

      const qb = this.requestRepo
        .createQueryBuilder("request")
        .leftJoinAndSelect("request.project", "proj")
        .leftJoinAndSelect("request.department", "dept")
        .leftJoinAndSelect("request.position", "pos")
        .leftJoinAndSelect("request.application", "app")
        .leftJoinAndSelect("request.created_by_user", "creator")
        .where("request.status_active = :active", { active: 1 });

      const columnMap: Record<string, string> = {
        id_request: "request.id_request",
        full_name: "request.full_name",
        badge_no: "request.badge_no",
        email: "request.email",
        request_status: "request.request_status",
        category_account: "request.category_account",
        department_name: "dept.name_of_department",
        project_name: "proj.project_name",
        application_name: "app.application_name",
        created_by_name: "creator.full_name",
      };

      if (search) {
        try {
          const filters = JSON.parse(search);
          for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null || value === "") continue;

            const column = columnMap[key] ?? `request.${key}`;
            qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
              [key]: `%${value}%`,
            });
          }
        } catch (e) {}
      }

      if (sort) {
        const [field, dir] = sort.split(",");
        const sortColumn = columnMap[field] ?? `request.${field}`;
        qb.orderBy(sortColumn, dir.toUpperCase() as "ASC" | "DESC");
      } else {
        qb.orderBy("request.id_request", "DESC");
      }

      const [entities, totalCount] = await qb
        .skip(skip)
        .take(take)
        .getManyAndCount();

      const data = entities.map((req) => ({
        ...req,
        created_by_name: req.created_by_user?.full_name || "-",
        department_name: req.department?.name_of_department || "-",
        project_name: req.project?.project_name || "-",
        position_name: req.position?.position_name || "-",
        application_name: req.application?.application_name || "-",
        category_account_name:
          req.category_account === 0
            ? "Create New Account"
            : "Request Permission",
      }));

      return {
        data,
        total: totalCount,
        total_pages: Math.ceil(totalCount / take),
        page,
        limit: take,
      };
    } catch (error) {
      console.error("DETAIL ERROR SQL:", error.message);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Detail pengajuan tunggal
   */
  async findOne(id: number) {
    const data = await this.requestRepo.findOne({
      where: { id_request: id },
      relations: [
        "project",
        "department",
        "position",
        "application",
        "created_by_user",
        "approval_hod_by",
        "approval_it_hod_by",
      ],
    });

    if (!data) throw new NotFoundException(`Request REQ-${id} not found`);
    return data;
  }

  /**
   * Membuat pengajuan baru
   */
  async create(data: Partial<RequestEntity>, userId: number) {
    const newRequest = this.requestRepo.create({
      ...data,
      created_by: userId,
      status_active: 1,
      request_status: 1,
    });

    const saved = await this.requestRepo.save(newRequest);

    this.notifyHod(saved.id_request).catch((e) =>
      console.error("Email Error:", e.message),
    );

    return { success: true, id_request: saved.id_request };
  }

  /**
   * Update pengajuan
   */
  async update(id_request: number, data: Partial<RequestEntity>) {
    const existing = await this.requestRepo.findOne({ where: { id_request } });
    if (!existing) throw new NotFoundException("Request not found");

    Object.assign(existing, data);
    return await this.requestRepo.save(existing);
  }

  /**
   * Batalkan pengajuan oleh pembuat (Soft Delete)
   */
  async cancelRequest(id_request: number, userId: number) {
    const existing = await this.requestRepo.findOne({
      where: { id_request, created_by: userId, status_active: 1 },
    });

    if (!existing)
      throw new NotFoundException("Request not found or unauthorized");

    existing.status_active = 0;
    existing.canceled_by = userId;
    return await this.requestRepo.save(existing);
  }

  /**
   * Bulk Approval oleh Department Head
   */
  async hodApprovalBulk(
    encryptedIds: string[],
    action: "approve" | "reject",
    remarks: string,
    userId: number,
  ) {
    for (const encId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encId));
      const req = await this.requestRepo.findOne({
        where: { id_request: id, request_status: 1 },
      });

      if (req) {
        req.approval_hod_by_id = userId;

        if (action === "approve") {
          req.request_status = 3;
          this.notifyItApproval(id).catch((e) => console.error(e));
        } else {
          req.request_status = 2;
          req.rejected_hod_remarks = remarks;
        }

        await this.requestRepo.save(req);
      }
    }
    return { success: true };
  }

  /**
   * Bulk Approval oleh IT Head
   */
  async itApprovalBulk(
    encryptedIds: string[],
    action: "approve" | "reject",
    remarks: string,
    userId: number,
  ) {
    for (const encId of encryptedIds) {
      const id = Number(this.aesEcbService.decryptBase64Url(encId));
      const req = await this.requestRepo.findOne({
        where: { id_request: id, request_status: 3 },
      });

      if (req) {
        req.approval_it_hod_by_id = userId;

        if (action === "approve") {
          req.request_status = 5;
        } else {
          req.request_status = 4;
          req.rejected_it_remarks = remarks;
        }

        await this.requestRepo.save(req);
      }
    }
    return { success: true };
  }

  async getHodsByDeptId(deptId: number) {
    return this.userRepo
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("user.id_department = :deptId", { deptId })
      .andWhere("role.role_name IN (:...roles)", {
        roles: ["Head Of Department", "Administrator"],
      })
      .select(["user.id_user", "user.badge_no", "user.full_name"])
      .getMany();
  }

  /**
   * Menghitung ringkasan status pengajuan
   */
  async getLatestPeriod() {
    return {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };
  }

  /**
   * Menghitung ringkasan status pengajuan
   * DISESUAIKAN agar menerima parameter dari controller
   */
  async getSummary(month?: number, year?: number) {
    try {
      const qb = this.requestRepo
        .createQueryBuilder("r")
        .where("r.status_active = 1");

      const [total, pending, rejected, completed] = await Promise.all([
        qb.getCount(),
        qb.clone().andWhere("r.request_status IN (1, 3)").getCount(),
        qb.clone().andWhere("r.request_status IN (2, 4)").getCount(),
        qb.clone().andWhere("r.request_status = 5").getCount(),
      ]);

      return { total, pending, rejected, completed };
    } catch (error) {
      throw new InternalServerErrorException("Summary error: " + error.message);
    }
  }

  async remove(id: number) {
    const result = await this.requestRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Request REQ-${id} not found`);

    return { success: true, message: "Request deleted successfully" };
  }

  private async notifyHod(id: number) {
    const req = await this.findOne(id);
    const hod = req.approval_hod_by;
    if (!hod?.email) return;

    const encId = this.aesEcbService.encryptToBase64Url(String(id));
    const html = this.mailService.renderTemplate("approval.ejs", {
      approverName: hod.full_name,
      requestNumber: `REQ-${String(id).padStart(6, "0")}`,
      requestorName: req.created_by_user?.full_name,
      targetFullName: req.full_name,
      approvalLink: `${process.env.ARMC_BASE_URL}/user_request/detail_req/${encId}`,
    });

    await this.mailService.sendSimpleEmail(
      hod.email,
      `Approval Required - REQ-${id}`,
      html,
    );
  }

  private async notifyItApproval(id: number) {
    const itManagers = await this.userRepo.find({
      where: { id_department: 1, id_role: 2 },
    });
    const emails = itManagers.map((u) => u.email).filter((e) => !!e);
    if (emails.length === 0) return;

    const req = await this.findOne(id);
    const encId = this.aesEcbService.encryptToBase64Url(String(id));
    const html = this.mailService.renderTemplate("approval.ejs", {
      approverName: "IT Manager",
      requestNumber: `REQ-${String(id).padStart(6, "0")}`,
      requestorName: req.created_by_user?.full_name,
      targetFullName: req.full_name,
      approvalLink: `${process.env.ARMC_BASE_URL}/user_request/detail_req/${encId}`,
    });

    await this.mailService.sendSimpleEmail(
      emails.join(","),
      `IT Approval Required - REQ-${id}`,
      html,
    );
  }
}
