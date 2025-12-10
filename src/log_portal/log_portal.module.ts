import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogPortalEntity } from './log_portal.entity';
import { LogPortalService } from './log_portal.service';
import { LogPortalController } from './log_portal.controller';
import { PortalAppPermissionModule } from 'portal_app_permission/app_permission.module';
import { RequestSubscriber } from 'portal_request_user_permission/subscribers/generic_log.subscriber';
import { UserModule } from 'portal_user_db/user.module';

@Module({
  imports: 
  [TypeOrmModule.forFeature([LogPortalEntity], 'alms'),
    TypeOrmModule.forFeature([LogPortalEntity]),         
    UserModule,                                      
    PortalAppPermissionModule,
  ],
  controllers: [LogPortalController],
  providers: [LogPortalService],
  exports: [LogPortalService],
})
export class LogPortalModule { }
