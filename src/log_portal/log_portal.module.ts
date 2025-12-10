import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogPortalEntity } from './log_portal.entity';
import { LogPortalService } from './log_portal.service';
import { LogPortalController } from './log_portal.controller';
import { PortalAppPermissionModule } from 'portal_app_permission/app_permission.module';
import { GenericLogSubscriber } from 'subscribers/generic_log.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([LogPortalEntity], 'alms'),
    PortalAppPermissionModule
  ],
  controllers: [LogPortalController],
  providers: [LogPortalService, GenericLogSubscriber],
  exports: [LogPortalService],
})
export class LogPortalModule { }
