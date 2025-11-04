import { Controller, Get, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';

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


}
