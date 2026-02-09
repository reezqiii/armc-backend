import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { PortalDepartmentService } from "./portal_department.service";
import { CreatePortalDepartmentDto } from "./dto/create-portal_department.dto";
import { UpdatePortalDepartmentDto } from "./dto/update-portal_department.dto";

@Controller("portal-department")
export class PortalDepartmentController {
  constructor(
    private readonly portalDepartmentService: PortalDepartmentService,
  ) {}

  @Post()
  create(@Body() createPortalDepartmentDto: CreatePortalDepartmentDto) {
    return this.portalDepartmentService.create(createPortalDepartmentDto);
  }

  @Get()
  findAll() {
    return this.portalDepartmentService.findAll();
  }

  @Get(":tempIssId")
  findOne(@Param("tempIssId") tempIssId: string) {
    return this.portalDepartmentService.findOne(+tempIssId);
  }

  @Patch(":tempIssId")
  update(
    @Param("tempIssId") tempIssId: string,
    @Body() updatePortalDepartmentDto: UpdatePortalDepartmentDto,
  ) {
    return this.portalDepartmentService.update(+tempIssId, updatePortalDepartmentDto);
  }

  @Delete(":tempIssId")
  remove(@Param("tempIssId") tempIssId: string) {
    return this.portalDepartmentService.remove(+tempIssId);
  }
}
