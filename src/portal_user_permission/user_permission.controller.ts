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
} from "@nestjs/common";
import { PortalUserPermissionService } from "./user_permission.service";
import { JwtAuthGuard } from "jwt-auth.guard";

@Controller("portal_user_permission")
export class PortalUserPermissionController {
  constructor(private readonly service: PortalUserPermissionService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(@Query("appId") appId: number, @Req() req) {
    const userId = req.user.id;
    return this.service.getUserPermissionsForApp(userId, appId);
  }

  @Get("user/:userId")
  getUserPermissionList(@Param("userId") userId: string) {
    return this.service.getUserPermissionList(+userId);
  }

  @Post("user/:userId/sync")
  @UseGuards(JwtAuthGuard)
  syncUserPermissions(
    @Param("userId") userId: string,
    @Body() body: { permission_ids: number[] },
    @Req() req,
  ) {
    const createdBy = req.user?.id ?? null;
    return this.service.syncUserPermissions(
      +userId,
      body.permission_ids,
      createdBy,
    );
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
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.service.delete(+id);
  }
}