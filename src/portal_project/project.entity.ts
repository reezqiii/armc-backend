import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequestEntity } from '../portal_request_user_permission/request.entity';

@Entity('portal_project')
export class Project {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  project_name: string;

  @Column({ name: 'project_code', type: 'varchar', length: 100, nullable: true })
  project_code: string;

  @OneToMany(() => RequestEntity, (request) => request.project)
  requests: RequestEntity[];
}
