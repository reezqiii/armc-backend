import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalPermission } from "./permission.entity";
import { PortalPermissionService } from "./permission.service";
import { PortalPermissionController } from "./permission.controller";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [TypeOrmModule.forFeature([PortalPermission]), CryptoModule],
  providers: [PortalPermissionService],
  controllers: [PortalPermissionController],
  exports: [TypeOrmModule, PortalPermissionService],
})
export class PortalPermissionModule {}
