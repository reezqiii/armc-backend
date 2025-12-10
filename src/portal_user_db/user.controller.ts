import { Controller, Get, Query, Param, Post, Put, Delete, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('api/user')
export class UserController {
  constructor(private readonly _user: UserService) { }

  @Get('/list')
  async GetUserList() {
    return this._user.findAll();
  }

  @Get('/search')
  async searchUsers(@Query('q') query: string) {
    return await this._user.searchUsers(query);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: number) {
    return await this._user.findOneById(id);
  }

  @Post()
  async createUser(@Body() data: Partial<User>) {
    return await this._user.createUser(data);
  }

  @Put('/:id')
  async updateUser(@Param('id') id: number, @Body() data: Partial<User>) {
    return await this._user.updateUser(id, data);
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    return await this._user.deleteUser(id);
  }

}
