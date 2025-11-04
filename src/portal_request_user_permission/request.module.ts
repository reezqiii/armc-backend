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

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity, User]),
    TypeOrmModule.forFeature([IssProject, IssDept, Position, IssEmployee], 'db_iss'),
  ],
  controllers: [RequestController],
  providers: [RequestService, UserService],
})
export class RequestModule {}
