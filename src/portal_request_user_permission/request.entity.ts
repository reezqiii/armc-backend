import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Project } from '../portal_project/project.entity';
import { Department } from '../portal_department/department.entity';
import { Role } from '../portal_master_role_permission_db/role.entity';

@Entity('portal_request_user_permission')
export class RequestEntity {
  @PrimaryGeneratedColumn({ name: 'id_request' })
  id_request: number;

  @Column({ name: 'id_role', type: 'int' })
  id_role: number;

  @Column({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'id_department', type: 'int' })
  id_department: number;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  full_name: string;

  @Column({ name: 'badge_no', type: 'varchar', length: 50 })
  badge_no: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'request_type', type: 'int' })
  request_type: number;

  @Column({ name: 'request_reason', type: 'text' })
  request_reason: string;

  @Column({ name: 'request_status', type: 'int' })
  request_status: number;

  @Column({ name: 'rejected_it_remarks', type: 'text', nullable: true })
  rejected_it_remarks: string;

  @Column({ name: 'rejected_hod_remarks', type: 'text', nullable: true })
  rejected_hod_remarks: string;

  @Column({ name: 'approval_it_date_at', type: 'timestamp', nullable: true })
  approval_it_date_at: Date;

  @Column({ name: 'approval_hod_date_at', type: 'timestamp', nullable: true })
  approval_hod_date_at: Date;

  @Column({ name: 'approval_it_sign_id', type: 'int', nullable: true })
  approval_it_sign_id: number;

  @Column({ name: 'approval_hod_sign_id', type: 'int', nullable: true })
  approval_hod_sign_id: number;

  @Column({ name: 'created_by', type: 'int' })
  created_by: number;

  @Column({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_date: Date;

  @Column({ name: 'status_active', type: 'int' })
  status_active: number;

  @Column({ name: 'canceled_by', type: 'int', nullable: true })
  canceled_by: number;

  @Column({ name: 'canceled_date', type: 'timestamp', nullable: true })
  canceled_date: Date;

   @ManyToOne(() => Project, (project) => project.requests, { eager: true })
  @JoinColumn({ name: 'project_id' })
  project: Project

  // 🧩 Relasi ke Department
  @ManyToOne(() => Department, (department) => department.requests, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department

  // 🧩 Relasi ke Role
  @ManyToOne(() => Role, (role) => role.requests, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role

}
