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
import { PortalProjectService } from "./portal_project.service";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("portal-project")
export class PortalProjectController {
  constructor(
    private readonly portalProjectService: PortalProjectService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.portalProjectService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.portalProjectService.create(body, req.user?.id_user);
  }

  @Get()
  findAll() {
    return this.portalProjectService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalProjectService.findOne(realId);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalProjectService.update(realId, body, req.user?.id_user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalProjectService.remove(realId, req.user?.id_user);
  }
}
