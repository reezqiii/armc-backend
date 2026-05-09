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
} from "@nestjs/common";
import { EngineeringService } from "./engineering.service";
import { ServerSideDTO } from "DTO/dto.serverside";

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
  findAll(@Query() query: ServerSideDTO) {
    return this.engineeringService.serverSideList(query);
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

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.engineeringService.remove(+id);
  }
}
