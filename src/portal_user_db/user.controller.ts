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

@Controller("api/user")
export class UserController {
  constructor(
    private readonly _user: UserService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("/list")
  async GetUserList() {
    return this._user.findAll();
  }

  @Put("/:id")
  @UseGuards(JwtAuthGuard)
  async updateUser(@Param("id") id: string, @Body() data: Partial<User>) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return await this._user.updateUser(realId, data);
  }

  @Post("/create")
  @UseGuards(JwtAuthGuard)
  async createUser(@Body() data: Partial<User>) {
    return await this._user.createUser(data);
  }

  @Get("/search")
  async searchUsers(@Query("q") query: string) {
    return await this._user.searchUsers(query);
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

  // @Post()
  // async createUser(@Body() data: Partial<User>) {
  //   return await this._user.createUser(data);
  // }

  // @Put('/:id')
  // async updateUser(@Param('id') id: number, @Body() data: Partial<User>) {
  //   return await this._user.updateUser(id, data);
  // }

  // @Delete('/:id')
  // async deleteUser(@Param('id') id: number) {
  //   return await this._user.deleteUser(id);
  // }
}
