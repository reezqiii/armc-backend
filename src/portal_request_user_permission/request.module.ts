import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestService } from './request.service';
import { UserService } from '../portal_user_db/user.service';
import { RequestController } from './request.controller';
import { RequestEntity } from './request.entity';
import { IssProject } from '../iss_project/iss_project.entity';
import { IssDept } from '../iss_dept/iss_dept.entity';
import { Position } from '../iss_design_new/position.entity';
import { User } from '../portal_user_db/user.entity';
import { IssEmployee } from 'iss_employee/employee.entity';
import { EmailModule } from 'email/email.module';
import { Company } from 'portal_company/company.entity';
import { NavMenu } from 'portal_nav_menu/menu.entity';
import { PortalPermissionModule } from 'portal_permission/permission.module';
import { PortalUserPermissionModule } from 'portal_user_permission/user_permission.module';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { LogPortalEntity } from 'log_portal/log_portal.entity';
import { LogPortalService } from 'log_portal/log_portal.service';
import { PortalAppPermissionModule } from 'portal_app_permission/app_permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, User, Company, NavMenu]),
    TypeOrmModule.forFeature([IssProject, IssDept, Position, IssEmployee], 'db_iss'),
    TypeOrmModule.forFeature([LogPortalEntity], 'alms'),
    EmailModule,
    PortalPermissionModule,
    PortalUserPermissionModule,
    PortalAppPermissionModule,
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    UserService,
    AesEcbService,
    LogPortalService,
  ],
   exports: [RequestService],
})
export class RequestModule { }
