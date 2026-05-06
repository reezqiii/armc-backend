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

@Controller("portal_user_permission")
export class PortalUserPermissionController {
  constructor(
    private readonly service: PortalUserPermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(@Req() req) {
    const userId = req.user.id_user;
    const roleId = req.user.id_role;

    return this.service.getPermissionIds(userId, roleId);
  }

  @Post("user/:userId/sync")
  @UseGuards(JwtAuthGuard)
  async syncUserPermissions(
    @Param("userId") userId: string,
    @Body() body: { permission_ids: number[] },
    @Req() req,
  ) {
    try {
      const realUserId = Number(this.aesEcbService.decryptBase64Url(userId));
      if (isNaN(realUserId)) throw new Error();

      const adminId = req.user?.id_user ?? null;

      return await this.service.syncUserPermissions(
        realUserId,
        body.permission_ids,
        adminId,
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
