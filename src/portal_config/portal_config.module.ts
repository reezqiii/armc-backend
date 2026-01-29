import { Module } from '@nestjs/common';
import { PortalConfigController } from './portal_config.controller';
import { PortalConfigService } from './portal_config.service';

@Module({
  controllers: [PortalConfigController],
  providers: [PortalConfigService]
})
export class PortalConfigModule {}
