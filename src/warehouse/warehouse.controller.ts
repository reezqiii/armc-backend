import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";

@Controller("warehouse")
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.warehouseService.findOne(+id);
  }

  @Post()
  create(@Body() body: any) {
    return this.warehouseService.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.warehouseService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.warehouseService.remove(+id);
  }
}
