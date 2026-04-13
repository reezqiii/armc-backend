import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortalDepartmentService } from "./portal_department.service";
import { PortalDepartmentController } from "./portal_department.controller";
import { PortalDepartment } from "./entities/portal_department.entity";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [TypeOrmModule.forFeature([PortalDepartment]), CryptoModule],
  controllers: [PortalDepartmentController],
  providers: [PortalDepartmentService],
})
export class PortalDepartmentModule {}
