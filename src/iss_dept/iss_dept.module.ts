import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssDeptService } from './iss_dept.service';
import { IssDeptController } from './iss_dept.controller';
import { IssDept } from './iss_dept.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssDept]),],
  providers: [IssDeptService],
  controllers: [IssDeptController],
  exports: [IssDeptService],
})
export class IssDeptModule { }
