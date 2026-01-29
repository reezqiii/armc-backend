import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalRoleDbService } from "./portal_role_db.service";
import { PortalRoleDbController } from "./portal_role_db.controller";
import { PortalRole } from "./entities/portal_role_db.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PortalRole])],
  controllers: [PortalRoleDbController],
  providers: [PortalRoleDbService],
  exports: [PortalRoleDbService],
})
export class PortalRoleDbModule {}
