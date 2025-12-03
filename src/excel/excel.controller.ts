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

@Controller('excel')
export class ExcelController {
  constructor(private readonly requestService: RequestService) { }

  @UseGuards(JwtAuthGuard)
  @Get('export-completed')
  async exportCompleted(
    @Query('search') search: string,
    @Query('sort_by') sort_by: string,
    @Query('sort_order') sort_order: string,
    @Res() res: Response,
  ) {
    const filters = search ? JSON.parse(search) : {};

    const requests = await this.requestService.exportList(
      filters,
      sort_by,
      sort_order,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Completed Requests');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'No Request', key: 'no_request', width: 15 },
      { header: 'Request Date', key: 'created_date', width: 20 },
      { header: 'Requestor', key: 'requestor', width: 30 },
      { header: 'Badge ID', key: 'badge_no', width: 15 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Project', key: 'project', width: 20 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Admin Status', key: 'admin_status', width: 15 },
    ];

    let no = 1;
    console.log('TOTAL DATA EXCEL:', requests.length);
    console.log('SAMPLE DATA:', requests[0]);
    requests.forEach(req => {
      sheet.addRow({
        no: no++,

        no_request: req.r_id_request,
        created_date: req.r_created_date
          ? new Date(req.r_created_date).toLocaleString()
          : '-',

        requestor: req.u_full_name || '-',
        badge_no: req.r_badge_no || '-',
        full_name: req.r_full_name || '-',

        department: req.d_department_name || '-',
        position: req.pos_position_name || '-',
        project: req.p_project_name || '-',

        company: req.c_company_name || '-',
        email: req.r_email || '-',

        status: req.r_request_status,
        admin_status: req.r_request_admin,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=completed_requests.xlsx',
    );

    res.status(HttpStatus.OK).end(buffer);
  }
}
