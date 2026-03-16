import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { PortalPermissionService } from "./permission.service";
import { PortalPermission } from "./permission.entity";

@Controller("portal-permission")
export class PortalPermissionController {
  constructor(private readonly service: PortalPermissionService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() body: Partial<PortalPermission>) {
    return this.service.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Partial<PortalPermission>) {
    return this.service.update(+id, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.service.delete(+id);
  }
}
