import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequestEntity } from '../portal_request_user_permission/request.entity';

@Entity('portal_project')
export class Project {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'project_code', type: 'varchar', length: 50 })
    project_code: string;

    @Column({ name: 'project_name', type: 'varchar', length: 255 })
    project_name: string;

    @OneToMany(() => RequestEntity, (request) => request.project)
    requests: RequestEntity[]


}
