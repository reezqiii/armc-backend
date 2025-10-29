import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RolePermission } from '../portal_role_permission/role_permission.entity';
import { Role } from '../portal_master_role_permission_db/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, RolePermission])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule { }
