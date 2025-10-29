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
import { User } from '../portal_user_db/user.entity';

@Entity('portal_request_user_permission')
export class RequestEntity {
  @PrimaryGeneratedColumn({ name: 'id_request' })
  id_request: number;

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

  @Column({ name: 'request_status', type: 'int', default: 0 })
  request_status: number;

  @Column({ name: 'rejected_it_remarks', type: 'text', nullable: true })
  rejected_it_remarks: string;

  @Column({ name: 'rejected_hod_remarks', type: 'text', nullable: true })
  rejected_hod_remarks: string;

  @Column({ name: 'approval_it_date_at', type: 'timestamp', nullable: true })
  approval_it_date_at: Date;

  @Column({ name: 'approval_hod_date_at', type: 'timestamp', nullable: true })
  approval_hod_date_at: Date;

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

  // Relasi ke Project
  @ManyToOne(() => Project, (project) => project.id)
  @JoinColumn({ name: 'id_project' })
  project: Project;

  // Relasi ke Department
  @ManyToOne(() => Department, (department) => department.id_department)
  @JoinColumn({ name: 'id_department' })
  department: Department;

  // Relasi ke Role
  @ManyToOne(() => Role, (role) => role.id_master_role)
  @JoinColumn({ name: 'id_master_role' })
  role: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_hod_by' }) // pastikan ini sama persis dengan nama kolom FK di DB
  approval_hod_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_it_hod_by' })
  approval_it_hod_by: User;


}