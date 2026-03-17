import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { Company } from "portal_company/company.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { CryptoModule } from "crypto/crypto.module";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { EmailModule } from "email/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PortalProject, PortalDepartment, Company, PortalRole, EmailModule]),
    CryptoModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
