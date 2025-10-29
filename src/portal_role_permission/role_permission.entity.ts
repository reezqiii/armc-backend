import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../portal_user_db/user.entity';

@Entity('portal_role_permission')
export class RolePermission {
  @PrimaryGeneratedColumn({ name: 'id_role_permission' })
  id_role_permission: number;

  @Column({ name: 'id_user', type: 'int' })
  id_user: number;

  @Column({ name: 'id_portal_app_permission', type: 'int' })
  id_portal_app_permission: number;

  @Column({ name: 'id_portal_permission', type: 'int' })
  id_portal_permission: number;

  @Column({ name: 'created_by', type: 'int' })
  created_by: number;

  @Column({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_date: Date;
  
  //  @OneToMany(() => User, (user) => user.role_permission, { nullable: true })
  // users?: User[];
}