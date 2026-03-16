import { Injectable } from "@nestjs/common";
import { CreatePortalDepartmentDto } from "./dto/create-portal_department.dto";
import { UpdatePortalDepartmentDto } from "./dto/update-portal_department.dto";
import { PortalDepartment } from "./entities/portal_department.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class PortalDepartmentService {
  constructor(
    @InjectRepository(PortalDepartment)
    private readonly departmentRepository: Repository<PortalDepartment>,
  ) {}

  create(createPortalDepartmentDto: CreatePortalDepartmentDto) {
    const department = this.departmentRepository.create(
      createPortalDepartmentDto,
    );
    return this.departmentRepository.save(department);
  }

  async findAll() {
    return this.departmentRepository.find({
      order: { name_department: "ASC" },
    });
  }

  findOne(id: number) {
    return this.departmentRepository.findOne({
      where: { id_department: id },
    });
  }

  update(id: number, updatePortalDepartmentDto: UpdatePortalDepartmentDto) {
    return this.departmentRepository.update(id, updatePortalDepartmentDto);
  }

  remove(id: number) {
    return this.departmentRepository.delete(id);
  }
}
