import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
      const where: FindOptionsWhere<User> = query
        ? { full_name: ILike(`%${query}%`) }
        : {};

      const users = await this._user.find({
        where,
        relations: ['department', 'project'],
        order: { full_name: 'ASC' },
      });

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

  // async updateUser(id: number, data: Partial<User>): Promise<User> {
  //   const user = await this._user.findOne({ where: { id_user: id } });
  //   if (!user) throw new NotFoundException('User not found');

  //   Object.assign(user, data);
  //   return await this._user.save(user);
  // }

  // // Insert
  // async createUser(data: Partial<User>): Promise<User> {
  //   const newUser = this._user.create(data);
  //   return await this._user.save(newUser); // log type = 2 (insert)
  // }

  // // Delete
  // async deleteUser(id: number): Promise<void> {
  //   const user = await this._user.findOne({ where: { id_user: id } });
  //   if (!user) throw new NotFoundException('User not found');

  //   await this._user.remove(user); // log type = 3 (delete)
  // }

}
