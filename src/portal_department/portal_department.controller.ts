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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.portalDepartmentService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updatePortalDepartmentDto: UpdatePortalDepartmentDto,
  ) {
    return this.portalDepartmentService.update(+id, updatePortalDepartmentDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.portalDepartmentService.remove(+id);
  }
}
