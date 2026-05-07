import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { RequestModule } from 'portal_request_user_permission/request.module';
import { UserModule } from 'portal_user_db/user.module';
@Module({
  imports: [RequestModule, UserModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
