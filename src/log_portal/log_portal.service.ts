import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogPortalEntity } from './log_portal.entity';

@Injectable()
export class LogPortalService {
    constructor(
        @InjectRepository(LogPortalEntity, 'alms')
        private readonly logPortalRepo: Repository<LogPortalEntity>,
    ) { }

    async saveLog(data: {
        table: string;
        index: number;
        before?: any;
        after?: any;
        user: number;
        column: string;
        type: number; // 1=update, 2=insert, 3=delete
        id_application: number;
    }) {
        const log = this.logPortalRepo.create({
            table: data.table,
            index: data.index,
            before: data.before !== undefined ? String(data.before) : null,
            after: data.after !== undefined ? String(data.after) : null,
            user: data.user,
            date: new Date(),
            column: data.column,
            type: data.type,
            id_application: data.id_application,
        });

        return await this.logPortalRepo.save(log);
    }

    async getHistoryByIndex(index: number) {
        return this.logPortalRepo.find({
            where: { index },
            order: { date: 'ASC' },
        });
    }
}
