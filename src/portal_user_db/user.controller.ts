import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { PortalUserPermissionService } from "../portal_user_permission/user_permission.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";
import { buildUserListExcel } from "excel/views/export_template";

@Controller("user")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly _user: UserService,
    private readonly _perm: PortalUserPermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("/stats")
  async getUserStats() {
    return await this._user.getUserStats();
  }

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this._user.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post("/create")
  async createUser(@Body() data: any, @Req() req) {
    return await this._user.createUser({ ...data, admin_id: req.user.id_user });
  }

  @Get("/:id")
  async getOne(@Param("id") id: string) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._user.findOneById(decryptedId);
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Put("/update/:id")
  async updateUser(@Param("id") id: string, @Body() data: any, @Req() req) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._user.updateUser(decryptedId, {
        ...data,
        admin_id: req.user.id_user,
      });
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string, @Req() req) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._user.deleteUser(decryptedId, req.user.id_user);
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Get("/extra-permissions/:id")
  async getUserExtraPermissions(@Param("id") id: string) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._perm.getUserExtraPermissions(decryptedId);
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Put("/extra-permissions/:id")
  async updateUserExtraPermissions(
    @Param("id") id: string,
    @Body() body: { permission_keys: number[] },
    @Req() req,
  ) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._perm.syncUserPermissions(
        decryptedId,
        body.permission_keys,
        req.user.id_user,
      );
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }
}
