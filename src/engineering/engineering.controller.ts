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
import { EngineeringService } from "./engineering.service";
import { ServerSideDTO } from "DTO/dto.serverside";

@Controller("engineering")
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Get()
  findAll(@Query() query: ServerSideDTO) {
    return this.engineeringService.serverSideList(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.engineeringService.findOne(+id);
  }

  @Post()
  create(@Body() body: any) {
    return this.engineeringService.create(body);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.engineeringService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.engineeringService.remove(+id);
  }
}
