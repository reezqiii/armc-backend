import { Controller, Get, Query, Put, Param } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // Test email manual
  @Get('test')
  async sendTest(@Query('to') to: string) {
    await this.mailService.sendTestEmail(to);
    return { message: `Test email sent to ${to} (check inbox/spam)` };
  }

  // Submit request to HOD
  @Put('send-to-hod/:requestId')
  async sendToHod(
    @Param('requestId') requestId: number,
    @Query('requestor') requestorName: string,
    @Query('hodEmail') hodEmail: string,
  ) {
    await this.mailService.sendHodApprovalEmail(hodEmail, requestorName, requestId);
    return { message: `Request ${requestId} submitted to HOD (${hodEmail})` };
  }
}
