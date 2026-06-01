import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";
import { ServerSideDTO } from "DTO/dto.serverside";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("warehouse")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Post("serverside_list")
  @RequirePermissions(20)
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.warehouseService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get()
  @RequirePermissions(20)
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get(":id")
  @RequirePermissions(20)
  findOne(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    if (isNaN(realId)) throw new BadRequestException("Invalid ID parameter");

    return this.warehouseService.findOne(realId);
  }

  @Post()
  @RequirePermissions(36)
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.create(body, userId);
  }

  @Put(":id")
  @RequirePermissions(37)
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    if (isNaN(realId)) throw new BadRequestException("Invalid ID parameter");

    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.update(realId, body, userId);
  }

  @Patch(":id/approve")
  @RequirePermissions(39)
  approve(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    if (isNaN(realId)) throw new BadRequestException("Invalid ID parameter");

    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.approve(realId, userId);
  }

  @Patch(":id/reject")
  @RequirePermissions(39)
  reject(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    if (isNaN(realId)) throw new BadRequestException("Invalid ID parameter");

    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.reject(realId, userId);
  }

  @Delete(":id")
  @RequirePermissions(38)
  remove(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    if (isNaN(realId)) throw new BadRequestException("Invalid ID parameter");

    return this.warehouseService.remove(realId);
  }
}
