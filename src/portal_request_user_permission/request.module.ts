import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { RequestEntity } from './request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity])],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
