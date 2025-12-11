import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogPortalEntity } from './log_portal.entity';
import { LogPortalService } from './log_portal.service';
import { LogPortalController } from './log_portal.controller';
import { RequestSubscriber } from 'portal_request_user_permission/subscribers/generic_log.subscriber';
import { UserModule } from 'portal_user_db/user.module';

@Module({
  imports:
    [TypeOrmModule.forFeature([LogPortalEntity], 'alms'),
      UserModule,
    ],
  controllers: [LogPortalController],
  providers: [LogPortalService],
  exports: [LogPortalService],
})
export class LogPortalModule { }
