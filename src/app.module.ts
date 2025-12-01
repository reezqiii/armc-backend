import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SftpModule } from './sftp/sftp.module';
import { ExcelModule } from './excel/excel.module';
import { PdfModule } from './pdf/pdf.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './portal/user.module';
import { BookingModule } from './bookings/booking.module';
import { CryptoModule } from './crypto/crypto.module'; 
import { RequestModule } from './portal_request_user_permission/request.module';
import { ProjectModule } from './portal_project/project.module';
import { DepartmentModule } from './portal_department/department.module';
import { RoleModule } from './portal_master_role_permission_db/role.module';
import { UserModule as UserDBModule } from './portal_user_db/user.module';
import { RolePermissionModule } from './portal_role_permission/role_permission.module';
import { PositionModule } from 'iss_design_new/position.module';
import { IssEmployeeModule } from 'iss_employee/employee.module';
import { IssProjectModule } from 'iss_project/iss_project.module';
import { IssDeptModule } from 'iss_dept/iss_dept.module';
import { CompanyModule } from 'portal_company/company.module';
import { NavMenuModule } from 'portal_nav_menu/menu.module';
import { EmailModule } from 'email/email.module';
import { PortalUserPermissionModule } from 'portal_user_permission/user_permission.module';

@Module({
  imports: [
    SftpModule,
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    // TypeOrmModule.forRootAsync({
    //   name: 'portal',
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     type: 'postgres',
    //     host: config.get('DB_PORTAL_HOST'),
    //     port: config.get('DB_PORTAL_PORT'),
    //     username: config.get('DB_PORTAL_USERNAME'),
    //     password: config.get('DB_PORTAL_PASSWORD'),
    //     database: config.get('DB_PORTAL_NAME'),
    //     autoLoadEntities: true,
    //     synchronize: false,
    //   }),
    // }),
    TypeOrmModule.forRootAsync({
      name: 'db_iss',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_ISS_HOST'),
        port: config.get('DB_ISS_PORT'),
        username: config.get('DB_ISS_USERNAME'),
        password: config.get('DB_ISS_PASSWORD'),
        database: config.get('DB_ISS_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    
    BookingModule,
    UserModule,
    PdfModule,
    ExcelModule,
    AuthModule,
    CryptoModule,
    RequestModule,
    ProjectModule,
    DepartmentModule,
    RoleModule,
    UserDBModule,
    RolePermissionModule,
    PortalUserPermissionModule,
    PositionModule,
    IssEmployeeModule,
    IssProjectModule,
    IssDeptModule,
    EmailModule,
    CompanyModule,
    NavMenuModule,
  ],
})
export class AppModule {} 