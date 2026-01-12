import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalPermission } from './permission.entity';

@Injectable()
export class PortalPermissionService {
  constructor(
    @InjectRepository(PortalPermission)
    private readonly permissionRepo: Repository<PortalPermission>,
  ) {}

  findAll() {
    return this.permissionRepo.find();
  }

  // findOne(id: number) {
  //   return this.permissionRepo.findOne({ where: { id_app_permission: id } });
  // }

  async create(data: Partial<PortalPermission>) {
    const newData = this.permissionRepo.create(data);
    return this.permissionRepo.save(newData);
  }

  // async update(id: number, data: Partial<PortalPermission>) {
  //   const find = await this.findOne(id);
  //   if (!find) throw new NotFoundException('Permission not found');

  //   await this.permissionRepo.update(id, data);
  //   return this.findOne(id);
  // }

  // async delete(id: number) {
  //   const find = await this.findOne(id);
  //   if (!find) throw new NotFoundException('Permission not found');

  //   return this.permissionRepo.delete(id);
  // }
}
