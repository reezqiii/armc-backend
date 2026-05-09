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
import { ProductionService } from "./production.service";
import { ServerSideDTO } from "DTO/dto.serverside";

@Controller("production")
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.productionService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Get()
  findAll(@Query() query: ServerSideDTO) {
    return this.productionService.serverSideList(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productionService.findOne(+id);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.create(body, userId);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any, @Req() req: any) {
    const userId = req.user?.id_user || req.user?.id;
    return this.productionService.update(+id, body, userId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productionService.remove(+id);
  }
}
