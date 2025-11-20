import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards, Patch, } from '@nestjs/common';
import { PortalUserPermissionService } from './user_permission.service';
import { JwtAuthGuard } from 'jwt-auth.guard';

@Controller('portal_user_permission')
export class PortalUserPermissionController {
    constructor(private readonly service: PortalUserPermissionService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMyPermissions(
        @Query('appId') appId: number,
        @Req() req,
    ) {
        console.log("USER FROM TOKEN:", req.user);
        const userId = req.user.id; 
        return this.service.getUserPermissionsForApp(userId, appId);
    }

    @Get(':userId/:appId')
    async getPermissionByUserAndApp(
        @Param('userId') userId: number,
        @Param('appId') appId: number,
    ) {
        return this.service.getUserPermissionsForApp(userId, appId);
    }

    @Get()
    getAll() {
        return this.service.findAll();
    }

    @Get(':id')
    getOne(@Param('id') id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.service.create(body);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    delete(@Param('id') id: number) {
        return this.service.delete(id);
    }
}
