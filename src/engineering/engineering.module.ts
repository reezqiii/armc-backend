import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineeringService } from './engineering.service';
import { EngineeringController } from './engineering.controller';
import { Engineering } from './entities/engineering.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Engineering])], 
  controllers: [EngineeringController],
  providers: [EngineeringService],
})
export class EngineeringModule {}