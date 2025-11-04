import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequestEntity } from '../portal_request_user_permission/request.entity';

@Entity('portal_master_role_permission_db')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_role' })
  id_role: number;

  @Column({ name: 'role_name', type: 'varchar', length: 255 })
  role_name: string;

  @Column({ name: 'status_active', type: 'int', default: 1 })
  status_active: number;

}
