import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalUserPermission } from "./user_permission.entity";
import { PortalUserPermissionController } from "./user_permission.controller";
import { PortalUserPermissionService } from "./user_permission.service";
import { PortalPermission } from "portal_permission/permission.entity";
import { CryptoModule } from "crypto/crypto.module";

import { RolePermission } from "role_has_permission/entities/role_has_permission.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalUserPermission,
      PortalPermission,
      RolePermission,
    ]),
    CryptoModule,
  ],
  controllers: [PortalUserPermissionController],
  providers: [PortalUserPermissionService],
  exports: [PortalUserPermissionService],
})
export class PortalUserPermissionModule {}
