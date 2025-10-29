import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { RequestEntity } from './request.entity';
import { Project } from '../portal_project/project.entity';
import { Department } from '../portal_department/department.entity';
import { Role } from '../portal_master_role_permission_db/role.entity';
import { User } from '../portal_user_db/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, Project, Department, Role]),
    TypeOrmModule.forFeature(
      [User],
      'portal'
    ),
  ],

  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule { }
