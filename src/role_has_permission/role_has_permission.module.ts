import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { PortalPermission } from "portal_permission/permission.entity";
import { RolePermissionController } from "./role_has_permission.controller";
import { RolePermissionService } from "./role_has_permission.service";
import { RolePermission } from "./entities/role_has_permission.entity";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermission, PortalRole, PortalPermission]),
    CryptoModule,
  ],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
