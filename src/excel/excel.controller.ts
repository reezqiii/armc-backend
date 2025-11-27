// import { Controller, Get, Res } from '@nestjs/common';
// import { ExcelService } from './excel.service';

// @Controller('api/excel')
// export class ExcelController {
//   constructor(private readonly _excel: ExcelService) {}

//   @Get('export')
//   async exportExcel(@Res() res) {
//     const data = [
//       { id: 1, name: 'John Doe', age: 25 },
//       { id: 2, name: 'Jane Smith', age: 30 },
//     ];
//     const buffer = await this._excel.generateExcel(data, 'Users');
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
//     res.end(buffer);
//   }
// }


import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { RequestService } from 'portal_request_user_permission/request.service';

@Controller('api/excel')
@UseGuards(JwtAuthGuard)
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly requestService: RequestService
  ) {}

  @Get('export-completed')
  async exportCompleted(
    @Query('search') search: string,
    @Query('sort_by') sort_by: string,
    @Query('sort_order') sort_order: string,
    @Res() res
  ) {
    const filters = search ? JSON.parse(search) : {};

    // Isi request_admin = 2 (Completed)
    filters.request_admin = 2;

    const data = await this.requestService.exportList(filters, sort_by, sort_order);

    const buffer = await this.excelService.generateExcel(data, 'Completed Requests');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=completed_requests.xlsx');
    res.end(buffer);
  }
}
