import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      throw new InternalServerErrorException(error);
    }
  }

  async searchUsers(query?: string): Promise<User[]> {
    try {
      // Jika query kosong, ambil semua HOD
      const where: FindOptionsWhere<User> = query
        ? { full_name: ILike(`%${query}%`) }
        : {};

      const users = await this._user.find({ where });

      return users;
    } catch (error) {
      console.error('Failed to search users:', error);
      throw new InternalServerErrorException(error);
    }
  }

  async findOneById(id: number): Promise<User | null> {
    try {
      return await this._user.findOne({ where: { id_user: id, status_user: 1 } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
