import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ProductionService } from "./production.service";
import { ServerSideDTO } from "DTO/dto.serverside";

@Controller("production")
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  findAll(@Query() query: ServerSideDTO) {
    return this.productionService.serverSideList(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productionService.findOne(+id);
  }

  @Post()
  create(@Body() body: any) {
    return this.productionService.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.productionService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productionService.remove(+id);
  }
}
