import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
} from "@nestjs/common";
import { PortalPermissionService } from "./permission.service";
import { PortalPermission } from "./permission.entity";
import { ServerSideDTO } from "DTO/dto.serverside";

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
  create(@Body() body: Partial<PortalPermission>, @Req() req: any) {
    return this.service.create(body, req.user?.id_user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: Partial<PortalPermission>,
    @Req() req: any,
  ) {
    return this.service.update(+id, body, req.user?.id_user);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @Req() req: any) {
    return this.service.delete(+id, req.user?.id_user);
  }

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    const dto: ServerSideDTO = {
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    };
    return this.service.serverSideList(dto);
  }
}
