import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalRoleDbService } from "./portal_role_db.service";
import { PortalRoleDbController } from "./portal_role_db.controller";
import { PortalRole } from "./entities/portal_role_db.entity";
import { CryptoModule } from "crypto/crypto.module";
import { RolePermission } from "role_has_permission/entities/role_has_permission.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalRole, RolePermission]),
    CryptoModule,
  ],
  controllers: [PortalRoleDbController],
  providers: [PortalRoleDbService],
  exports: [PortalRoleDbService],
})
export class PortalRoleDbModule {}
