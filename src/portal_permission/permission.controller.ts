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
import { PortalPermissionService } from "./permission.service";
import { PortalPermission } from "./permission.entity";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("portal-permission")
export class PortalPermissionController {
  constructor(
    private readonly service: PortalPermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.service.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post()
  create(@Body() body: Partial<PortalPermission>, @Req() req: any) {
    return this.service.create(body, req.user?.id_user);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("grouped")
  getGrouped() {
    return this.service.findAllGrouped();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.service.findOne(realId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: Partial<PortalPermission>,
    @Req() req: any,
  ) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.service.update(realId, body, req.user?.id_user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));

    return this.service.delete(realId, req.user?.id_user);
  }
}
