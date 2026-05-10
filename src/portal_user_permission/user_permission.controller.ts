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
import { PortalUserPermissionService } from "./user_permission.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { AesEcbService } from "crypto/aes-ecb.service";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@Controller("portal_user_permission")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PortalUserPermissionController {
  constructor(
    private readonly service: PortalUserPermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("me")
  async getMyPermissions(@Req() req) {
    return this.service.getPermissionIds(req.user.id_user, req.user.id_role);
  }

  @Post("user/:userId/sync")
  async syncUserPermissions(
    @Param("userId") userId: string,
    @Body() body: { permission_ids: number[] },
    @Req() req,
  ) {
    try {
      const realUserId = Number(this.aesEcbService.decryptBase64Url(userId));
      if (isNaN(realUserId)) throw new Error();

      return await this.service.syncUserPermissions(
        realUserId,
        body.permission_ids,
        req.user.id_user,
      );
    } catch (error) {
      throw new BadRequestException("Invalid Encrypted User ID for Sync");
    }
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getOne(@Param("id") id: string) {
    const decryptedId = this.aesEcbService.decryptBase64Url(id);
    const realId = Number(decryptedId);

    if (isNaN(realId)) throw new BadRequestException("Invalid ID");
    return this.service.findOne(realId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.service.update(realId, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.service.delete(realId);
  }
}
