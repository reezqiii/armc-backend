import { Controller, Get } from '@nestjs/common';
import { Public } from 'auth/public.decorator';

@Controller('portal/config')
export class PortalConfigController {

  @Public()
  @Get()
  getPortalConfig() {
    return {
      background_image: "/img/seatrium_1.jpg"
    };
  }
}
