import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PermissionGuard } from "./permission.guard";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExcelModule } from "./excel/excel.module";
import { AuthModule } from "./auth/auth.module";
import { BookingModule } from "./bookings/booking.module";
import { CryptoModule } from "./crypto/crypto.module";
import { RequestModule } from "./portal_request_user_permission/request.module";
import { NavMenuModule } from "./portal_nav_menu/menu.module";
import { EmailModule } from "./email/email.module";
import { PortalUserPermissionModule } from "./portal_user_permission/user_permission.module";
import { PortalCategoryAccountModule } from "./portal_category_account/portal_category_account.module";
import { PortalConfigModule } from "./portal_config/portal_config.module";
import { join } from "node:path";
import { ServeStaticModule } from "@nestjs/serve-static";
import { PortalProjectModule } from "./portal_project/portal_project.module";
import { PortalDepartmentModule } from "./portal_department/portal_department.module";
import { PortalRoleDbModule } from "./portal_role_db/portal_role_db.module";
import { RolePermissionModule } from "./role_has_permission/role_has_permission.module";
import { UserModule } from "portal_user_db/user.module";
import { JwtAuthGuard } from "jwt-auth.guard";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
      serveRoot: "/",
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: config.get("DB_PORT"),
        username: config.get("DB_USERNAME"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // TypeOrmModule.forRootAsync({
    //   name: "db_iss",
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     type: "postgres",
    //     host: config.get("DB_ISS_HOST"),
    //     port: config.get("DB_ISS_PORT"),
    //     username: config.get("DB_ISS_USERNAME"),
    //     password: config.get("DB_ISS_PASSWORD"),
    //     database: config.get("DB_ISS_NAME"),
    //     autoLoadEntities: true,
    //     synchronize: false,
    //   }),
    // }),

    TypeOrmModule.forRootAsync({
      name: "alms",
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_ALMS_HOST"),
        port: config.get("DB_ALMS_PORT"),
        username: config.get("DB_ALMS_USERNAME"),
        password: config.get("DB_ALMS_PASSWORD"),
        database: config.get("DB_ALMS_NAME"),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    BookingModule,
    UserModule,
    ExcelModule,
    AuthModule,
    CryptoModule,
    RequestModule,
    PortalUserPermissionModule,
    EmailModule,
    NavMenuModule,
    PortalConfigModule,
    PortalProjectModule,
    PortalDepartmentModule,
    PortalRoleDbModule,
    PortalCategoryAccountModule,
    RolePermissionModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
