import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { LogPortalService } from './log_portal.service';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { ServerSideLogDTO } from './DTO/ServerSideLogDTO';

@Controller('log_portal')
export class LogPortalController {
    constructor(private readonly logService: LogPortalService) { }

    @Get(':id')
async getLogById(@Param('id') id: number) {
  return this.logService.getLogById(id);
}

    @Post('/serverside_list')
    async getLogs(@Query('search') searchStr: string,
        @Query('sort_by') sortBy: string,
        @Query('sort_order') sortOrder: 'ASC' | 'DESC',
        @Query('page') page: number,
        @Query('size') size: number) {
        const filters = JSON.parse(searchStr || '{}');
        return this.logService.getLogs(filters, sortBy, sortOrder, page, size);
    }
}

