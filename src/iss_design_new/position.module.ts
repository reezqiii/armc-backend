// src/portal_position_db/position.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './position.entity';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Position], 'db_iss'),],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService, TypeOrmModule],
})
export class PositionModule {}
