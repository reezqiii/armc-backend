import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PortalRole } from "./entities/portal_role_db.entity";
import { CreatePortalRoleDbDto } from "./dto/create-portal_role_db.dto";
import { UpdatePortalRoleDbDto } from "./dto/update-portal_role_db.dto";

@Injectable()
export class PortalRoleDbService {
  constructor(
    @InjectRepository(PortalRole)
    private readonly roleRepository: Repository<PortalRole>,
  ) {}

  async create(createDto: CreatePortalRoleDbDto, userId?: number) {
    const role = this.roleRepository.create({
      ...createDto,
      is_active: 1,
      created_by: userId ?? null,
    });
    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({
      where: { is_active: 1 }, // ← hanya tampilkan active
      order: { role_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id_role: id, is_active: 1 },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async update(id: number, updateDto: UpdatePortalRoleDbDto, userId?: number) {
    const role = await this.findOne(id);
    Object.assign(role, {
      ...updateDto,
      updated_by: userId ?? null,
    });
    return this.roleRepository.save(role);
  }

  async remove(id: number, userId?: number) {
    const role = await this.findOne(id);
    role.is_active = 0;
    role.deleted_by = userId ?? null;
    return this.roleRepository.save(role);
  }
}
