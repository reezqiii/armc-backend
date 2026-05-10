import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { EngineeringService } from "./engineering.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@Controller("engineering")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post("serverside_list")
  @RequirePermissions(18)
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.engineeringService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get()
  @RequirePermissions(18)
  findAll() {
    return this.engineeringService.findAll();
  }

  @Get(":id")
  @RequirePermissions(18)
  findOne(@Param("id") id: string) {
    return this.engineeringService.findOne(+id);
  }

  @Post()
  @RequirePermissions(19)
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.create(body, userId);
  }

  @Put(":id")
  @RequirePermissions(22)
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.update(+id, body, userId);
  }

  @Patch(":id/approve")
  @RequirePermissions(24)
  approve(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.approve(+id, userId);
  }

  @Patch(":id/reject")
  @RequirePermissions(24)
  reject(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.reject(+id, userId, body.remarks);
  }

  @Delete(":id")
  @RequirePermissions(23)
  remove(@Param("id") id: string) {
    return this.engineeringService.remove(+id);
  }
}
