import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from "@nestjs/common";
import { PortalDepartmentService } from "./portal_department.service";

@Controller("portal-department")
export class PortalDepartmentController {
  constructor(
    private readonly portalDepartmentService: PortalDepartmentService,
  ) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.portalDepartmentService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.portalDepartmentService.create(body, req.user?.id_user);
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
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    return this.portalDepartmentService.update(+id, body, req.user?.id_user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.portalDepartmentService.remove(+id, req.user?.id_user);
  }
}
