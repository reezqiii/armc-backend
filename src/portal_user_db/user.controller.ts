import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("user")
export class UserController {
  constructor(
    private readonly _user: UserService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("/list")
  async GetUserList() {
    return this._user.findAll();
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async getStats() {
    return this._user.getStats();
  }

  @Get("/hods-by-dept/:dept_id")
  @UseGuards(JwtAuthGuard)
  async getHodsByDept(@Param("dept_id") dept_id: number) {
    return this._user.getHodsByDept(Number(dept_id));
  }

  @Get("/search")
  async searchUsers(@Query("q") query: string) {
    return await this._user.searchUsers(query);
  }

  @Post("/serverside_list")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async serverSide(@Query() queryDto: ServerSideDTO) {
    return await this._user.serverSideList(queryDto);
  }

  @Post("/create")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async createUser(@Body() data: Partial<User>) {
    return await this._user.createUser(data);
  }

  @Put("/update/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async updateUser(@Param("id") id: string, @Body() data: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return await this._user.updateUser(realId, data);
  }

  @Post("/reset-password")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.reset_password")
  async resetPasswordByAdmin(@Body() body: { id_user: number }) {
    return await this._user.resetPasswordByAdmin(body.id_user);
  }

  @Get("/extra-permissions/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async getUserExtraPermissions(@Param("id") id: string) {
    return await this._user.getUserExtraPermissions(Number(id));
  }

  @Put("/extra-permissions/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async updateUserExtraPermissions(
    @Param("id") id: string,
    @Body() body: { permission_keys: string[] },
    @Req() req,
  ) {
    return await this._user.updateUserExtraPermissions(
      Number(id),
      body.permission_keys,
      req.user.id_user,
    );
  }

  @Get("/:id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("user.manage")
  async getUserById(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return await this._user.findOneById(realId);
  }
}
