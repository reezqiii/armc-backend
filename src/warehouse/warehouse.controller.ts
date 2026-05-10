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
} from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";
import { ServerSideDTO } from "DTO/dto.serverside";

@Controller("warehouse")
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.warehouseService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.warehouseService.findOne(+id);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.create(body, userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.update(+id, body, userId);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.approve(+id, userId);
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.warehouseService.reject(+id, userId, body.remarks);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.warehouseService.remove(+id);
  }
}
