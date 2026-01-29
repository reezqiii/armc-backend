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

  async create(createDto: CreatePortalRoleDbDto) {
    const role = this.roleRepository.create(createDto);
    return this.roleRepository.save(role);
  }

  async findAll() {
    return this.roleRepository.find({
      order: { role_name: "ASC" },
    });
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOne({ where: { id_role: id } });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async update(id: number, updateDto: UpdatePortalRoleDbDto) {
    const result = await this.roleRepository.update(id, updateDto);
    if (result.affected === 0) throw new NotFoundException("Role not found");
    return { message: "Role updated successfully" };
  }

  async remove(id: number) {
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException("Role not found");
  }
}
