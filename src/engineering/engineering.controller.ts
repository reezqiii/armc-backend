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
import { EngineeringService } from "./engineering.service";

@Controller("engineering")
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.engineeringService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get()
  findAll() {
    return this.engineeringService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.engineeringService.findOne(+id);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.create(body, userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.update(+id, body, userId);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.approve(+id, userId);
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.engineeringService.reject(+id, userId, body.remarks);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.engineeringService.remove(+id);
  }
}
