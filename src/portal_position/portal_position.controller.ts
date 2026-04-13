import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from "@nestjs/common";
import { PortalPositionService } from "./portal_position.service";
import { CreatePortalPositionDto } from "./dto/create-portal_position.dto";
import { UpdatePortalPositionDto } from "./dto/update-portal_position.dto";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("portal-position")
export class PortalPositionController {
  constructor(
    private readonly portalPositionService: PortalPositionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this.portalPositionService.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post()
  create(@Body() createDto: CreatePortalPositionDto, @Req() req: any) {
    return this.portalPositionService.create(createDto, req.user?.id_user);
  }

  @Get()
  findAll() {
    return this.portalPositionService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalPositionService.findOne(realId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdatePortalPositionDto,
    @Req() req: any,
  ) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalPositionService.update(
      realId,
      updateDto,
      req.user?.id_user,
    );
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    const realId = Number(this.aesEcbService.decryptBase64Url(id));
    return this.portalPositionService.remove(realId, req.user?.id_user);
  }
}
