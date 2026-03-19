import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestService } from "./request.service";
import { RequestController } from "./request.controller";
import { RequestEntity } from "./request.entity";
import { User } from "../portal_user_db/user.entity";
import { EmailModule } from "email/email.module";
import { Company } from "portal_company/company.entity";
import { NavMenu } from "portal_nav_menu/menu.entity";
import { PortalPermissionModule } from "portal_permission/permission.module";
import { PortalUserPermissionModule } from "portal_user_permission/user_permission.module";
import { AesEcbService } from "crypto/aes-ecb.service";
import { PdfModule } from "pdf/pdf.module";
import { UserModule } from "portal_user_db/user.module";
import { CategoryAccount } from "portal_category_account/entities/portal_category_account.entity";
import { PortalPermission } from "portal_permission/permission.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      User,
      Company,
      NavMenu,
      CategoryAccount,
      PortalProject,
      PortalDepartment,
      PortalPermission,
    ]),
    EmailModule,
    PdfModule,
    PortalPermissionModule,
    PortalUserPermissionModule,
    UserModule,
  ],
  controllers: [RequestController],
  providers: [RequestService, AesEcbService],
  exports: [RequestService],
})
export class RequestModule {}
