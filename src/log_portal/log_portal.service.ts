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

        for (const [key, value] of Object.entries(filters)) {
            if (!value) continue;

            switch (key) {
                case 'index':
                    query.andWhere('log.index = :idx', { idx: Number(value) });
                    break;

                case 'before':
                case 'after':
                    query.andWhere(`CAST(log.${key} AS TEXT) ILIKE :val`, {
                        val: `%${value}%`,
                    });
                    break;

                case 'date':
                    query.andWhere(`CAST(log.date AS TEXT) ILIKE :val`, {
                        val: `%${value}%`,
                    });
                    break;

                case 'full_name': {
                    const users = await this.defaultDataSource.query(
                        `
        SELECT id_user
        FROM portal_user_db
        WHERE full_name ILIKE $1
        `,
                        [`%${value}%`],
                    );

                    const userIds = users.map(u => u.id_user);

                    if (userIds.length === 0) {
                        query.andWhere('1 = 0');
                    } else {
                        query.andWhere('log.user = ANY(:userIds)', { userIds });
                    }
                    break;
                }

                default:
                    query.andWhere(`log.${key} ILIKE :val`, {
                        val: `%${value}%`,
                    });
                    break;
            }
        }

        const allowedSortColumns = [
            'id',
            'table',
            'index',
            'date',
            'type',
            'user',
            'id_application',
        ];

        const isSortByName = sortBy === 'full_name';

        if (!allowedSortColumns.includes(sortBy)) {
            sortBy = 'date';
        }

        const total = await query.getCount();

        const logs = await query
            .orderBy(`log.${sortBy}`, sortOrder)
            .skip(page * size)
            .take(size)
            .getMany();

        const userIdList = [
            ...new Set(logs.map(l => l.user).filter(Boolean)),
        ];

        let userMap: Record<number, string> = {};

        if (userIdList.length > 0) {
            const users = await this.defaultDataSource.query(
                `
        SELECT id_user, full_name
        FROM portal_user_db
        WHERE id_user = ANY($1)
        `,
                [userIdList],
            );

            userMap = Object.fromEntries(
                users.map(u => [u.id_user, u.full_name]),
            );
        }

        let data = logs.map(l => ({
            ...l,
            full_name: userMap[l.user] || null,
        }));

        if (isSortByName) {
            data.sort((a, b) =>
                (a.full_name || '').localeCompare(b.full_name || ''),
            );

            if (sortOrder === 'DESC') data.reverse();
        }

        return {
            data,
            total_pages: Math.ceil(total / size),
            total,
        };
    }

    async getLogById(id: number) {
        return await this.almsDataSource.getRepository(LogPortalEntity).findOne({
            where: { id },
        });
    }
}
