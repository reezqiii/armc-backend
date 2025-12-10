import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogPortalEntity } from './log_portal.entity';
import { ServerSideLogDTO } from './DTO/ServerSideLogDTO';
import { PortalAppPermission } from 'portal_app_permission/app_permission.entity';

@Injectable()
export class LogPortalService {
    constructor(
        @InjectRepository(LogPortalEntity, 'alms')
        private readonly logPortalRepo: Repository<LogPortalEntity>,
        @InjectRepository(PortalAppPermission) // default connection
        private readonly permissionRepo: Repository<PortalAppPermission>,
    ) { }

    async saveLog(data: {
        table: string;
        index: number;
        before?: any;
        after?: any;
        user: number;
        type: number; // 1=update, 2=insert, 3=delete
        id_application: number;
    }) {
        const log = this.logPortalRepo.create({
            table: data.table,
            index: data.index,
            before: data.before !== undefined ? JSON.stringify(data.before) : null,
            after: data.after !== undefined ? JSON.stringify(data.after) : null,
            user: data.user,
            date: new Date(),
            type: data.type,
            id_application: data.id_application,
        });

        return await this.logPortalRepo.save(log);
    }

    async getHistoryByApplication(id_application: number) {
        const logs = await this.logPortalRepo.find({
            where: { id_application },
            order: { date: 'DESC' },
        });

        // ambil aplikasi dari koneksi default
        const app = await this.permissionRepo.findOne({ where: { id_application } });

        return logs.map(log => ({
            ...log,
            app_name: app?.app_name || null,
        }));
    }

    async getServersideList(filters: any, sortBy: string, sortOrder: 'ASC' | 'DESC', page: number, size: number) {
        const query = this.logPortalRepo.createQueryBuilder('log');

        // Filter id_application
        if (filters.id_application) {
            query.andWhere('log.id_application = :id', { id: filters.id_application });
        }

        // Filter by table/index/user if ada
        if (filters.table) query.andWhere('log.table ILIKE :table', { table: `%${filters.table}%` });
        if (filters.index) query.andWhere('log.index = :index', { index: filters.index });
        if (filters.user) query.andWhere('log.user = :user', { user: filters.user });

        const total = await query.getCount();

        // Sorting
        query.orderBy(`log.${sortBy}`, sortOrder);

        // Pagination
        query.skip(page * size).take(size);

        const data = await query.getMany();

        return { data, total_pages: Math.ceil(total / size) };
    }

}
