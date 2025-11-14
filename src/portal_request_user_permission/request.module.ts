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
import { Role } from 'portal_master_role_permission_db/role.entity';
import { EmailModule } from 'email/email.module';
import { Company } from 'portal_company/company.entity';
import { NavMenu } from 'portal_nav_menu/menu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, User, Role, Company, NavMenu]),
    TypeOrmModule.forFeature([IssProject, IssDept, Position, IssEmployee], 'db_iss'),
    EmailModule,
  ],
  controllers: [RequestController],
  providers: [RequestService, UserService],
})
export class RequestModule {}
