import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Req,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ProductionService } from "./production.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@Controller("production")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post("serverside_list")
  @RequirePermissions(15)
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.productionService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get(":id")
  @RequirePermissions(15)
  findOne(@Param("id") id: string) {
    return this.productionService.findOne(+id);
  }

  @Post()
  @RequirePermissions(30)
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.create(body, userId);
  }

  @Put(":id")
  @RequirePermissions(31)
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.update(+id, body, userId);
  }

  @Patch(":id/approve")
  @RequirePermissions(33)
  approve(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.approve(+id, userId);
  }

  @Patch(":id/reject")
  @RequirePermissions(33)
  reject(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.reject(+id, userId, body.remarks);
  }

  @Delete(":id")
  @RequirePermissions(32)
  remove(@Param("id") id: string) {
    return this.productionService.remove(+id);
  }
}
