import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { Company } from "portal_company/company.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { IssDeptModule } from "iss_dept/iss_dept.module";
import { IssDept } from "iss_dept/iss_dept.entity";
import { CryptoModule } from "crypto/crypto.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PortalProject, Company, PortalRole]),
    TypeOrmModule.forFeature([IssDept], "db_iss"),
    CryptoModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
