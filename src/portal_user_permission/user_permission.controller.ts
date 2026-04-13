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
  async getMyPermissions(@Query("appId") appId: number, @Req() req) {
    const userId = req.user.id;
    return this.service.getUserPermissionsForApp(userId, appId);
  }

  @Get("user/:userId")
  getUserPermissionList(@Param("userId") userId: string) {
    try {
      const decryptedId = this.aesEcbService.decryptBase64Url(userId);
      const realUserId = Number(decryptedId);

      if (isNaN(realUserId)) throw new Error();

      return this.service.getUserPermissionList(realUserId);
    } catch (error) {
      throw new BadRequestException("Invalid Encrypted User ID");
    }
  }

  @Post("user/:userId/sync")
  @UseGuards(JwtAuthGuard)
  syncUserPermissions(
    @Param("userId") userId: string,
    @Body() body: { permission_ids: number[] },
    @Req() req,
  ) {
    try {
      const decryptedId = this.aesEcbService.decryptBase64Url(userId);
      const realUserId = Number(decryptedId);

      if (isNaN(realUserId)) throw new Error();

      const createdBy = req.user?.id ?? null;
      return this.service.syncUserPermissions(
        realUserId,
        body.permission_ids,
        createdBy,
      );
    } catch (error) {
      throw new BadRequestException("Invalid Encrypted User ID for Sync");
    }
  }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(":userId/:appId")
  async getPermissionByUserAndApp(
    @Param("userId") userId: string,
    @Param("appId") appId: string,
  ) {
    return this.service.getUserPermissionsForApp(+userId, +appId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
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
