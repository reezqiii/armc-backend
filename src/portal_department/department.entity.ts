import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RequestEntity } from '../portal_request_user_permission/request.entity';

@Entity('portal_department')
export class Department {
  @PrimaryGeneratedColumn({ name: 'id_department' })
  id_department: number;

  @Column({ name: 'name_of_department', type: 'varchar', length: 255 })
  name_of_department: string;

}
