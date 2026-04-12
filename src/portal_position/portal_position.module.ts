import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/portal_position.entity';
import { PortalPositionController } from './portal_position.controller';
import { PortalPositionService } from './portal_position.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Position])], 
  controllers: [PortalPositionController],
  providers: [PortalPositionService],
})
export class PortalPositionModule {}