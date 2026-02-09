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
      select: ["temp_iss_id", "name_of_department"],
      order: { name_of_department: "ASC" },
    });
  }

  findOne(tempIssId: number) {
    return this.departmentRepository.findOne({
      where: { temp_iss_id: tempIssId },
      select: ["temp_iss_id", "name_of_department"],
    });
  }

  update(tempIssId: number, updatePortalDepartmentDto: UpdatePortalDepartmentDto) {
    return this.departmentRepository.update(tempIssId, updatePortalDepartmentDto);
  }

  remove(id: number) {
    return this.departmentRepository.delete(id);
  }
}
