import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import * as pug from 'pug';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class EmailService {
  private readonly EMAIL_API_URL = 'http://10.5.255.166/api_email/public/api/email';
  private readonly JWT_SECRET = '163f721bd2e3a61264244ae0bfd3a37e';

  async sendHodApprovalEmail(data: {
    to: string;
    cc?: string;
    bcc?: string;
    requestNumber: string;
    requestorName: string;
    requestDate: string;
    requestDescription: string;
    publicLink: string;
    smoeLink: string;
    attachments?: {
      filename: string;
      content: Buffer | string;
    }[];
  }) {
    try {
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'hod_approval.pug');
      const htmlContent = pug.renderFile(templatePath, {
        requestNumber: data.requestNumber,
        requestorName: data.requestorName,
        requestDate: data.requestDate,
        requestDescription: data.requestDescription,
        publicLink: data.publicLink,
        smoeLink: data.smoeLink,
        currentYear: new Date().getFullYear(),
      });

      const token = jwt.sign({ data: 'SEATRIUM EMAIL' }, this.JWT_SECRET, { algorithm: 'HS256' });

      const payload: any = {
        htmlContent,
        subject: `New IT Request - ${data.requestNumber}`,
        JWT_TOKEN: process.env.EMAIL_SECRET_KEY,
        email_to: data.to,
      };

      if (data.cc) payload.email_cc = data.cc;
      if (data.bcc) payload.email_bcc = data.bcc;
      if (data.attachments) {
        payload.attachment_list = data.attachments.map(file => ({
          attachment: Buffer.isBuffer(file.content)
            ? file.content.toString('base64')
            : file.content,
          attachment_name: path.basename(file.filename),
        }));
      }

      const res = await axios.post(this.EMAIL_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

    } catch (error) {
      console.error('Failed to send email:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw new HttpException({ success: false, message: 'Failed to send email' }, 500);
    }
  }
}