import {
  Controller,
  Get,
  Res,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { RequestService } from 'portal_request_user_permission/request.service';
import * as ExcelJS from 'exceljs';
import { buildCompletedExcelTemplate } from './views/export_template';

@Controller('excel')
export class ExcelController {
  constructor(private readonly requestService: RequestService) { }

  @Get('export-list')
  async exportCompleted(
    @Query('search') search: string,
    @Query('sort_by') sort_by: string,
    @Query('sort_order') sort_order: string,
    @Query('status') status: string, 
    @Res() res: Response,
  ) {
    try {
      const filters = search ? JSON.parse(search) : {};

      const statusMapping: Record<string, number> = {
        'draft': 0,
        'awaiting_hod_approval': 1,
        'rejected_hod_approval': 2,
        'awaiting_lead_it_approval': 3,
        'rejected_lead_it_approval': 4,
        'awaiting_manager_approval': 5,
        'rejected_manager_approval': 6,
        'completed': 7,
        'returned': 8,
      };

      if (status && statusMapping[status.toLowerCase()] !== undefined) {
        filters.request_status = statusMapping[status.toLowerCase()];
      }

      const requests = await this.requestService.exportList(
        filters,
        sort_by,
        sort_order,
      );

      const label = status ? status.toUpperCase() : 'ALL';
      const buffer = await buildCompletedExcelTemplate(requests);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Export_Requests_${label}.xlsx`);

      return res.status(HttpStatus.OK).end(buffer);

    } catch (err) {
      console.error("ERROR EXPORT EXCEL:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Export Excel failed",
        error: err.message,
      });
    }
  }
}