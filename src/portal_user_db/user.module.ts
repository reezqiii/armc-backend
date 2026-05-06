import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { CryptoModule } from "crypto/crypto.module";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { EmailModule } from "email/email.module";
import { ConfigModule } from "@nestjs/config";
import { PortalUserPermission } from "portal_user_permission/user_permission.entity";
import { PortalPermission } from "portal_permission/permission.entity";

import { PortalUserPermissionModule } from "portal_user_permission/user_permission.module";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      PortalProject,
      PortalDepartment,
      PortalRole,
      PortalUserPermission,
      PortalPermission,
    ]),
    CryptoModule,
    EmailModule,

    PortalUserPermissionModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
