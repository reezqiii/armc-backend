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
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("portal-department")
export class PortalDepartmentController {
  constructor(
    private readonly portalDepartmentService: PortalDepartmentService,
    private readonly aesEcbService: AesEcbService,
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
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalDepartmentService.findOne(realId);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalDepartmentService.update(realId, body, req.user?.id_user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalDepartmentService.remove(realId, req.user?.id_user);
  }
}
