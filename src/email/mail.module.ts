import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { join } from 'path';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: process.env.EMAIL_HOST,
                port: 587,
                secure: false, // STARTTLS
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            },
            defaults: {
                from: `"No Reply" <${process.env.EMAIL_USERNAME}>`,
            },
            template: {
                dir: join(process.cwd(), 'src/templates'), // dari root project
                adapter: new PugAdapter(),
                options: { strict: true },
            },
        }),
    ],
    providers: [MailService],
    controllers: [MailController],
    exports: [MailService],
})
export class MailModule { }
