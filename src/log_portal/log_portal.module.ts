import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogPortalEntity } from './log_portal.entity';
import { LogPortalService } from './log_portal.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([LogPortalEntity], 'alms'),
    ],
    providers: [LogPortalService],
    exports: [LogPortalService], 
})
export class LogPortalModule { }
