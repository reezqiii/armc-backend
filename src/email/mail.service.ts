import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendHodApprovalEmail(to: string, requestorName: string, requestId: number) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `Approval Request dari ${requestorName}`,
                template: 'hod_approval',
                context: {
                    requestorName,
                    requestDate: new Date().toLocaleDateString(),
                },
            });
        } catch (err) {
            console.error('Failed to send HOD approval email:', err);
        }
    }

    async sendTestEmail(to: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Test Email',
                text: 'Ini email test dari NestJS!',
            });
        } catch (err) {
            console.error('Failed to send test email:', err);
        }
    }
}
