import { Controller, Get, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';

@Controller('api/excel')
export class ExcelController {
  constructor(private readonly _excel: ExcelService) {}

  @Get('export')
  async exportExcel(@Res() res) {
    const data = [
      { id: 1, name: 'John Doe', age: 25 },
      { id: 2, name: 'Jane Smith', age: 30 },
    ];
    const buffer = await this._excel.generateExcel(data, 'Users');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.end(buffer);
  }
}
