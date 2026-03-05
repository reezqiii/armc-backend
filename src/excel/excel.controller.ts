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
  @Query('search') search: string, // Ini biasanya berisi JSON string dari UI
  @Query('sort_by') sort_by: string,
  @Query('sort_order') sort_order: string,
  @Query('status') status: string, 
  @Res() res: Response,
) {
  try {
    // 1. Parsing filter dari search query
    let filters = {};
    if (search) {
      try {
        filters = JSON.parse(search);
      } catch (e) {
        // Jika bukan JSON, anggap sebagai search string biasa untuk 'full_name'
        filters = { r_full_name: search }; 
      }
    }

    // 2. Tambahkan filter status jika ada
    const statusMapping: Record<string, number> = {
      'completed': 7,
      // ... mapping lainnya
    };

    if (status && statusMapping[status.toLowerCase()] !== undefined) {
      filters['r_request_status'] = statusMapping[status.toLowerCase()];
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
    // ... error handling
  }
}
}