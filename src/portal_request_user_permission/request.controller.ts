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
  BadRequestException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequestService } from "./request.service";
import { RequestEntity } from "./request.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { JwtAuthGuard } from "jwt-auth.guard";
import { AesEcbService } from "../crypto/aes-ecb.service";
import { UserService } from "../portal_user_db/user.service";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@ApiTags("Requests")
@Controller("requests")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly userService: UserService,
    private readonly aesEcb: AesEcbService,
  ) {}


  /**
   * Ambil data list dengan metode Server-Side (POST)
   */
  @Post("/serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.requestService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  /**
   * Detail Request berdasarkan ID (Ter-enkripsi)
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const numericId = Number(this.aesEcb.decryptBase64Url(id));
    if (isNaN(numericId)) throw new BadRequestException("Invalid request ID");

    return this.requestService.findOne(numericId);
  }

  /**
   * Create Request Baru
   */
  @Post("/create")
  @UseGuards(PermissionGuard)
  async create(@Body() data: Partial<RequestEntity>, @Req() req) {
    const userId = req.user.id_user;
    return this.requestService.create(data, userId);
  }

  /**
   * Update Request
   */
  @Put(":id")
  @UseGuards(PermissionGuard)
  async update(@Param("id") id: string, @Body() data: Partial<RequestEntity>) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    if (isNaN(decId)) throw new BadRequestException("Invalid ID");

    return this.requestService.update(decId, data);
  }

  /**
   * Cancel Request oleh User
   */
  @Put("cancel/:id")
  @UseGuards(PermissionGuard)
  async cancelRequest(@Param("id") id: string, @Req() req) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const userId = req.user.id_user;

    return this.requestService.cancelRequest(decId, userId);
  }

  /**
   * Approval Massal oleh HOD
   */
  @Put("hod-approval/bulk")
  @UseGuards(PermissionGuard)
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
      body.remarks ?? "",
      req.user.id_user,
    );
  }

  /**
   * Approval Massal oleh IT Head
   */
  @Put("it-approval/bulk")
  @UseGuards(PermissionGuard)
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
      body.remarks ?? "",
      req.user.id_user,
    );
  }
  
 @Get("hods-by-dept/:deptId")
  async getHodsByDept(@Param("deptId") deptId: string) {
    return this.userService.getHodsByDeptId(Number(deptId));
  }

  @Get("dashboard/latest-period")
  getLatestPeriod() {
    return this.requestService.getLatestPeriod();
  }

  @Get("dashboard/summary")
  getDashboardSummary(@Query() query: any) {
    return this.requestService.getSummary(query.month, query.year);
  }

  /**
   * Delete Request (Hard Delete)
   */
  @Delete(":id")
  @UseGuards(PermissionGuard)
  async remove(@Param("id") id: number) {
    return this.requestService.remove(id);
  }
}
