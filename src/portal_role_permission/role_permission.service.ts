import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './role_permission.entity';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  findAll(): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find();
  }

  findOne(id: number): Promise<RolePermission> {
    return this.rolePermissionRepository.findOne({ where: { id_role_permission: id } });
  }

  create(data: Partial<RolePermission>): Promise<RolePermission> {
    const rolePermission = this.rolePermissionRepository.create(data);
    return this.rolePermissionRepository.save(rolePermission);
  }
}
