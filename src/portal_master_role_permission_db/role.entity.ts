import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequestEntity } from '../portal_request_user_permission/request.entity';

@Entity('portal_master_role_permission_db')
export class Role {
    @PrimaryGeneratedColumn({ name: 'id_role' })
    id_role: number;

    @Column({ length: 100 })
    role_name: string;

    @OneToMany(() => RequestEntity, (request) => request.role)
    requests: RequestEntity[]

}
