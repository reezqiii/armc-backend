import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'portal_user_db' })
export class User {
  @PrimaryGeneratedColumn({ name: 'id_user', type: 'int' })
  id_user: number;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  created_date: Date;

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: true })
  full_name: string;

  @Column({ name: 'badge_no', type: 'varchar', length: 200, nullable: true })
  badge_no: string;

  @Column({ name: 'username', type: 'varchar', length: 200, nullable: true })
  username: string;

  @Column({ name: 'company', type: 'int', nullable: true })
  company: number;

  @Column({ name: 'department', type: 'int', nullable: true })
  department: number;

  @Column({ name: 'id_role', type: 'int', nullable: true })
  id_role: number;

  @Column({ name: 'project_id', type: 'int', nullable: true })
  project_id: number;

  @Column({ name: 'status_user', type: 'int', nullable: true })
  status_user: number;

  @Column({ name: 'update_by', type: 'int', nullable: true })
  update_by: number;

  @Column({ name: 'id_role_permission', type: 'int', nullable: true })
  id_role_permission: number;
}
