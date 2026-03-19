import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Patch,
  BadRequestException,
  UnauthorizedException,
  StreamableFile,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RequestService } from "./request.service";
import { RequestEntity } from "./request.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { JwtAuthGuard } from "jwt-auth.guard";
import { AesEcbService } from "../crypto/aes-ecb.service";
import { UserService } from "../portal_user_db/user.service";
import { Public } from "auth/public.decorator";
import { response } from "express";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@Controller("requests")
@ApiBearerAuth("access-token")
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly userService: UserService,
    private readonly aesEcb: AesEcbService,
  ) {}

  @Get("hods")
  @UseGuards(JwtAuthGuard)
  async getHods() {
    return this.userService.getUsersByRoles([
      "Head Of Department",
      "Administrator",
    ]);
  }

  @Post("/create")
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() data: Partial<RequestEntity>,
    @Req() req,
  ): Promise<RequestEntity> {
    const userId = req.user.id_user;
    return this.requestService.create(data, userId);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() data: Partial<RequestEntity>,
    @Req() req,
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));

    if (data.status_active === 0) {
      data.canceled_by = req.user?.id_user;
    }

    return this.requestService.update(decId, data);
  }

  @Put("cancel/:id")
  @UseGuards(JwtAuthGuard)
  async cancelRequest(@Param("id") id: string, @Req() req) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const userId = req.user.id_user;
    return this.requestService.cancelRequest(decId, userId);
  }

  @Put(":id/hod-approval")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.approve_hod") // ← TAMBAH
  async hodApproval(
    @Param("id") id: string,
    @Body() body: { action: string; remarks?: string },
    @Req() req,
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    if (isNaN(decId)) throw new BadRequestException("Invalid request ID");
    return this.requestService.hodApproval(
      decId,
      body.action,
      body.remarks,
      req.user.id_user,
    );
  }

  @Put("hod-approval/bulk")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.approve_hod") // ← TAMBAH
  hodApprovalBulk(
    @Body()
    body: {
      encryptedIds: string[];
      action: "approve" | "reject";
      remarks?: string;
    },
    @Req() req,
  ) {
    return this.requestService.hodApprovalBulk(
      body.encryptedIds,
      body.action,
      body.remarks,
      req.user.id_user,
    );
  }

  @Put(":id/submit-to-hod")
  @UseGuards(JwtAuthGuard)
  async submitToHodRequest(@Param("id") encryptedId: string, @Req() req: any) {
    const userId = req.user?.id;
    return await this.requestService.submitToHod(encryptedId, userId);
  }

  @Put("submit-to-hod/bulk")
  @UseGuards(JwtAuthGuard)
  async submitBulkToHod(
    @Body() body: { encryptedIds: string[] },
    @Req() req: any,
  ) {
    const userId = req.user?.id_user;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    return this.requestService.submitBulkToHod(body.encryptedIds, userId);
  }

  @Put(":id/it-approval")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.approve_it") // ← TAMBAH
  async itApproval(
    @Param("id") id: string,
    @Body() body: { action: string; remarks?: string },
    @Req() req,
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    return this.requestService.itApproval(
      decId,
      body.action,
      body.remarks,
      req.user.id_user,
    );
  }

  @Put("it-approval/bulk")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.approve_it") // ← TAMBAH
  async itApprovalBulk(
    @Body()
    body: {
      encryptedIds: string[];
      action: "approve" | "reject";
      remarks?: string;
    },
    @Req() req,
  ) {
    return this.requestService.itApprovalBulk(
      body.encryptedIds,
      body.action,
      body.remarks,
      req.user.id_user,
    );
  }

  @Patch(":id/admin-status")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage") // ← TAMBAH
  async updateAdminStatus(
    @Param("id") id_request: number,
    @Body("request_admin") request_admin: number,
  ): Promise<{ message: string }> {
    await this.requestService.updateAdminStatus(id_request, request_admin);
    return { message: "Admin status updated successfully" };
  }

  @Get(":id/generate-pdf")
  async generateRequestPdf(
    @Param("id") enc_id: string,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.requestService.generateRequestPdf(enc_id);

    return new StreamableFile(pdfBuffer, {
      type: "application/pdf",
      disposition: 'attachment; filename="pcms_request.pdf"',
    });
  }

  @Get("dashboard/latest-period")
  @UseGuards(JwtAuthGuard)
  getLatestPeriod() {
    return this.requestService.getLatestPeriod();
  }

  @Get("dashboard/summary")
  @UseGuards(JwtAuthGuard)
  getDashboardSummary(@Query() query) {
    return this.requestService.getSummary(query.month, query.year);
  }

  @Delete(":id")
  remove(@Param("id") id: number): Promise<void> {
    return this.requestService.remove(id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    let numericId: number;
    try {
      numericId = Number(this.aesEcb.decryptBase64Url(id));
      if (isNaN(numericId)) throw new Error();
    } catch {
      throw new BadRequestException("Invalid request ID");
    }
    return this.requestService.findOne(numericId);
  }

  @Post("/serverside_list")
  @UseGuards(JwtAuthGuard)
  async serverSideList(@Query() query: any, @Req() req: any) {
    if (query.sort_by) {
      query.sort = `${query.sort_by},${(
        query.sort_order || "ASC"
      ).toUpperCase()}`;
    }

    const dto: ServerSideDTO = query;
    return this.requestService.serverSideList(dto, req.user);
  }
}
