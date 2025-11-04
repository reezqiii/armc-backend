import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssProjectService } from './iss_project.service';
import { IssProjectController } from './iss_project.controller';
import { IssProject } from './iss_project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssProject], 'db_iss')],
  providers: [IssProjectService],
  controllers: [IssProjectController],
  exports: [IssProjectService],
})
export class IssProjectModule { }
