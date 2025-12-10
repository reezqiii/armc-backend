import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { LogPortalService } from './log_portal.service';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { ServerSideLogDTO } from './DTO/ServerSideLogDTO';

@Controller('log_portal')
export class LogPortalController {
    constructor(private readonly logPortalService: LogPortalService) { }

    @Get(':id_application')
    async getHistory(@Param('id_application') id: number) {
        return this.logPortalService.getHistoryByApplication(Number(id));
    }

    // @Get('/test-log')
    // async testLog(@Req() req: any) {
    //     try {
    //         return await this.logPortalService.saveLog({
    //             table: "pcms_request",
    //             index: 123,
    //             before: "Old Value",
    //             after: "New Value",
    //             user: 1,
    //             type: 1,
    //             id_application: 999
    //         });
    //     } catch (error) {
    //         console.error("LOG PORTAL ERROR:", error);
    //         return {
    //             message: error.message,
    //             detail: error,
    //         };
    //     }
    // }

    @Post('/serverside_list')
    async getServersideList(
        @Query('search') search: string,
        @Query('sort_by') sortBy: string = 'date',
        @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'DESC',
        @Query('page') page: number = 0,
        @Query('size') size: number = 10,
    ) {
        const filters = JSON.parse(search || '{}');
        return this.logPortalService.getServersideList(filters, sortBy, sortOrder, page, size);
    }

}
