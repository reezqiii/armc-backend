import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestService } from "./request.service";
import { RequestController } from "./request.controller";
import { EmailModule } from "email/email.module";
import { PortalPermissionModule } from "portal_permission/permission.module";
import { PortalUserPermissionModule } from "portal_user_permission/user_permission.module";
import { AesEcbService } from "crypto/aes-ecb.service";
import { PdfModule } from "pdf/pdf.module";
import { UserModule } from "portal_user_db/user.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RequestEntity } from "./request.entity";
import { User } from "portal_user_db/user.entity";
import { NavMenu } from "portal_nav_menu/menu.entity";
import { CategoryAccount } from "portal_category_account/entities/portal_category_account.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalPermission } from "portal_permission/permission.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestEntity,
      User,
      NavMenu,
      CategoryAccount,
      PortalProject,
      PortalDepartment,
      PortalPermission,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
    }),
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
