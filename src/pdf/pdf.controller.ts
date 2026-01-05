import { Controller, Get, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { Public } from '../public.decorator';

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Public()
  @Get('download')
  async downloadPdf(@Res() res) {
    const pdfBuffer = await this.pdfService.generatePdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="booking-report.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
