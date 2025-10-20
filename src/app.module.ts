import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SftpModule } from './sftp/sftp.module';
import { ExcelModule } from './excel/excel.module';
import { PdfModule } from './pdf/pdf.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './portal/user.module';
import { BookingModule } from './bookings/booking.module';
import { CryptoModule } from './crypto/crypto.module'; 
import { RequestModule } from './request/request.module';

@Module({
  imports: [
    SftpModule,
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: 'portal',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_PORTAL_HOST'),
        port: config.get('DB_PORTAL_PORT'),
        username: config.get('DB_PORTAL_USERNAME'),
        password: config.get('DB_PORTAL_PASSWORD'),
        database: config.get('DB_PORTAL_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    
    BookingModule,
    UserModule,
    PdfModule,
    ExcelModule,
    AuthModule,
    CryptoModule,
    RequestModule,
   
  ],
})
export class AppModule {} 