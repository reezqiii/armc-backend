import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from "jwt-auth.guard";

@Controller('portal/config')
export class PortalConfigController {

  @UseGuards(JwtAuthGuard) 
  @Get()
  getPortalConfig() {
    return {
      background_image: "/img/bg_portal.jpg" 
    };
  }
}