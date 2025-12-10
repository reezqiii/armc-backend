import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalAppPermission } from './app_permission.entity';



@Injectable()
export class PortalAppPermissionService {
  constructor(
    @InjectRepository(PortalAppPermission)
    private readonly permissionRepo: Repository<PortalAppPermission>,
  ) {}

  async findAll(): Promise<PortalAppPermission[]> {
    return this.permissionRepo.find();
  }

  async findOne(id: number): Promise<PortalAppPermission | null> {
    return this.permissionRepo.findOne({ where: { id_application: id } });
  }

  async create(data: Partial<PortalAppPermission>): Promise<PortalAppPermission> {
    const newPermission = this.permissionRepo.create(data);
    return this.permissionRepo.save(newPermission);
  }

  async update(id: number, data: Partial<PortalAppPermission>): Promise<PortalAppPermission> {
    await this.permissionRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.permissionRepo.delete(id);
  }
}
