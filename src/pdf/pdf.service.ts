import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as ejs from "ejs";
import * as puppeteer from "puppeteer";
import * as fs from "fs";

@Injectable()
export class PdfService {
  public getBase64Image(filePath: string): string {
    const image = fs.readFileSync(filePath);
    return image.toString("base64");
  }

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
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    const pdfBuffer = Buffer.from(pdfUint8Array);
    await browser.close();
    return pdfBuffer;
  }

  async generatePdf2(htmlContent: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
      <div style="font-size: 9px; width: 100%; margin: 0 10mm; display: flex; justify-content: space-between; font-family: Arial, sans-serif; color: #333;">
        <span>Form No: F14-IT-PTSMOEI-A</span>
        <div>
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      </div>`,
      margin: {
        top: "10mm",
        bottom: "20mm", 
        left: "10mm", 
        right: "10mm",
      },
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  renderTemplate(filename: string, data: any) {
    const filePath = path.join(process.cwd(), "src", "pdf", "views", filename);
    const template = fs.readFileSync(filePath, "utf8");
    return ejs.render(template, data);
  }
}
