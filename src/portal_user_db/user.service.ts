import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly _user: Repository<User>,
  ) { }

  async findAll(): Promise<User[]> {
    try {
      return await this._user.find();
    } catch (error) {
      throw new Error(error);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];

    try {
      return await this._user.find({
        where: { full_name: ILike(`%${query}%`) }, // % untuk partial match
      });
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}
