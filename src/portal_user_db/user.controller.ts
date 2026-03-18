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
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { JwtAuthGuard } from "jwt-auth.guard";
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

  @Put("/bulk-update")
  @UseGuards(JwtAuthGuard)
  async bulkUpdateUsers(
    @Body()
    users: {
      id_user: number;
      outside_access?: number;
      status_user?: number;
      role_id?: number;
      department_id?: number;
    }[],
  ) {
    return await this._user.bulkUpdateUsers(users);
  }

  @Post("/create")
  @UseGuards(JwtAuthGuard)
  async createUser(@Body() data: Partial<User>) {
    return await this._user.createUser(data);
  }

  @Put("/update/:id")
  @UseGuards(JwtAuthGuard)
  async updateUser(@Param("id") id: string, @Body() data: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return await this._user.updateUser(realId, data);
  }

  @Get("stats")
  async getStats() {
    return this._user.getStats();
  }

  @Get("/search")
  async searchUsers(@Query("q") query: string) {
    return await this._user.searchUsers(query);
  }

  @Post("/reset-password")
  @UseGuards(JwtAuthGuard)
  async resetPasswordByAdmin(@Body() body: { id_user: number }) {
    return await this._user.resetPasswordByAdmin(body.id_user);
  }

  @Get("/:id")
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));

    return await this._user.findOneById(realId);
  }

  @Post("/serverside_list")
  async serverSide(@Query() queryDto: ServerSideDTO) {
    const data = await this._user.serverSideList(queryDto);
    return data;
  }
}
