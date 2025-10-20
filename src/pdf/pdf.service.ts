import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generatePdf(): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #007bff; }
            .card {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            img {
              width: 200px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Booking Report</h1>
          <div class="card">
            <p>Data booking berhasil dibuat!</p>
            <img src="https://www.smoebatam.com/smoe_portal/assets/seatrium/logo/logo_white.png" />
          </div>
        </body>
      </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    const pdfBuffer = Buffer.from(pdfUint8Array);
    await browser.close();
    return pdfBuffer;
  }
}
