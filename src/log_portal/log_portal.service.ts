import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LogPortalEntity } from './log_portal.entity';

@Injectable()
export class LogPortalService {
    constructor(
        @InjectDataSource('alms')
        private readonly almsDataSource: DataSource,

        @InjectDataSource()
        private readonly defaultDataSource: DataSource,
    ) { }

    async getLogs(filters: any, sortBy = 'date', sortOrder: 'ASC' | 'DESC' = 'DESC', page = 0, size = 10) {

        const logRepo = this.almsDataSource.getRepository(LogPortalEntity);

        const query = logRepo.createQueryBuilder('log');

        if (filters.id_application) {
            query.andWhere('log.id_application = :id', { id: Number(filters.id_application) });
        }

        Object.keys(filters).forEach(key => {
            if (key !== 'id_application' && filters[key]) {
                query.andWhere(`log.${key} LIKE :value`, { value: `%${filters[key]}%` });
            }
        });

        const total = await query.getCount();

        const logs = await query
            .orderBy(`log.${sortBy}`, sortOrder)
            .skip(page * size)
            .take(size)
            .getMany();

        const userIdList = [...new Set(logs.map(l => l.user))];

        const users = await this.defaultDataSource.query(
            `SELECT id_user, full_name 
     FROM portal_user_db 
     WHERE id_user = ANY($1)`,
            [userIdList]
        );

        const userMap = Object.fromEntries(
            users.map(u => [u.id_user, u.full_name])
        );

        const data = logs.map(l => ({
            ...l,
            full_name: userMap[l.user] || null,
        }));

        return { data, total_pages: Math.ceil(total / size) };
    }

    async getLogById(id: number) {
        return await this.almsDataSource.getRepository(LogPortalEntity).findOne({
            where: { id },
        });
    }
}
