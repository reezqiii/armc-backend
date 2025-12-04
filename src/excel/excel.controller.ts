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

  @UseGuards(JwtAuthGuard)
  @Get('export-list')
  async exportCompleted(
    @Query('search') search: string,
    @Query('sort_by') sort_by: string,
    @Query('sort_order') sort_order: string,
    @Res() res: Response,
  ) {
    try {
      const filters = search ? JSON.parse(search) : {};

      const requests = await this.requestService.exportList(
        filters,
        sort_by,
        sort_order,
      );

      const buffer = await buildCompletedExcelTemplate(requests);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=export_requests_list.xlsx',
      );

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