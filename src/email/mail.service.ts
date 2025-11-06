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
            console.log(`Email approval sent to ${to}`);
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
            console.log('Test email sent successfully');
        } catch (err) {
            console.error('Failed to send test email:', err);
        }
    }
}
