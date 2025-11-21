import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalUserPermission } from './user_permission.entity';

@Injectable()
export class PortalUserPermissionService {
    constructor(
        @InjectRepository(PortalUserPermission)
        private userPermRepo: Repository<PortalUserPermission>,
    ) { }

    async getUserPermissionsForApp(userId: number, appId: number): Promise<{
        approvalLeadIt: string[];
        approvalItManager: string[];
    }> {
        const rows = await this.userPermRepo.find({
            where: {
                id_user: userId,
                id_portal_app_permission: appId.toString(),
            },
        });
        const leadItPermissions = [];
        const itManagerPermissions = [];

        rows.forEach((item) => {
            if (item.index_key === '0') {
                leadItPermissions.push(item.id_portal_permission);
            }
            if (item.index_key === '1') {
                itManagerPermissions.push(item.id_portal_permission);
            }
        });

        return {
            approvalLeadIt: leadItPermissions,
            approvalItManager: itManagerPermissions,
        };
    }

    findAll() {
        return this.userPermRepo.find();
    }

    findOne(id: number) {
        return this.userPermRepo.findOne({ where: { id } });
    }

    create(data: Partial<PortalUserPermission>) {
        const newData = this.userPermRepo.create(data);
        return this.userPermRepo.save(newData);
    }

    async update(id: number, data: Partial<PortalUserPermission>) {
        const find = await this.findOne(id);
        if (!find) throw new NotFoundException('User permission not found');

        await this.userPermRepo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        const find = await this.findOne(id);
        if (!find) throw new NotFoundException('User permission not found');

        return this.userPermRepo.delete(id);
    }
}
