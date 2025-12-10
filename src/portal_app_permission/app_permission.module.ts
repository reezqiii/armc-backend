import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalAppPermission } from './app_permission.entity';
import { PortalAppPermissionService } from './app_permission.service';
import { PortalAppPermissionController } from './app_permission.controller';


@Module({
    imports: [TypeOrmModule.forFeature([PortalAppPermission])], 
    providers: [PortalAppPermissionService],
    controllers: [PortalAppPermissionController],
    exports: [TypeOrmModule, PortalAppPermissionService], 
})
export class PortalAppPermissionModule { }