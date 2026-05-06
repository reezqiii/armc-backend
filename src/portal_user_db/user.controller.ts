import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { PortalUserPermissionService } from "../portal_user_permission/user_permission.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("user")
export class UserController {
  constructor(
    private readonly _user: UserService,
    private readonly _perm: PortalUserPermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Post("/serverside_list")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(102)
  async serverSide(@Body() queryDto: ServerSideDTO) {
    return await this._user.serverSideList(queryDto);
  }

  @Post("/create")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(103)
  async createUser(@Body() data: any, @Req() req) {
    return await this._user.createUser({ ...data, admin_id: req.user.id_user });
  }

  @Get("/extra-permissions/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(102)
  async getUserExtraPermissions(@Param("id") id: string) {
    return await this._perm.getUserExtraPermissions(Number(id));
  }

  @Put("/extra-permissions/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(102)
  async updateUserExtraPermissions(
    @Param("id") id: string,
    @Body() body: { permission_keys: number[] },
    @Req() req,
  ) {
    return await this._perm.syncUserPermissions(
      Number(id),
      body.permission_keys,
      req.user.id_user,
    );
  }
}
