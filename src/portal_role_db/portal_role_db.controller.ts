import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from "@nestjs/common";
import { PortalRoleDbService } from "./portal_role_db.service";
import { CreatePortalRoleDbDto } from "./dto/create-portal_role_db.dto";
import { UpdatePortalRoleDbDto } from "./dto/update-portal_role_db.dto";

@Controller("role")
export class PortalRoleDbController {
  constructor(private readonly portalRoleDbService: PortalRoleDbService) {}

  @Post()
  create(@Body() createDto: CreatePortalRoleDbDto, @Req() req: any) {
    return this.portalRoleDbService.create(createDto, req.user?.id_user);
  }

  @Get()
  findAll() {
    return this.portalRoleDbService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.portalRoleDbService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdatePortalRoleDbDto,
    @Req() req: any,
  ) {
    return this.portalRoleDbService.update(+id, updateDto, req.user?.id_user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.portalRoleDbService.remove(+id, req.user?.id_user);
  }
}
