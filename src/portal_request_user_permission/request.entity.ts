import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
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

  @Column({ name: 'request_admin', type: 'int', default: 0 })
  request_admin: number;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'rejected_it_remarks', type: 'text', nullable: true })
  rejected_it_remarks: string;

  @Column({ name: 'rejected_hod_remarks', type: 'text', nullable: true })
  rejected_hod_remarks: string;

  @Column({ name: 'rejected_lead_remarks', type: 'text', nullable: true })
  rejected_lead_remarks: string;

  @Column({ name: 'approval_it_date_at', type: 'timestamp', nullable: true })
  approval_it_date_at: Date;

  @Column({ name: 'approval_hod_date_at', type: 'timestamp', nullable: true })
  approval_hod_date_at: Date;

  @Column({ name: 'approval_lead_date_at', type: 'timestamp', nullable: true })
  approval_lead_date_at: Date;

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

  @Column({ name: 'project_id', type: 'int', nullable: true })
  project_id: number;

  @Column({ name: 'dept_id', type: 'int', nullable: true })
  dept_id: number;

  @Column({ name: 'design_id', type: 'int', nullable: true })
  design_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_hod_by' })
  approval_hod_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_it_hod_by' })
  approval_it_hod_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_lead_it_by' })
  approval_lead_it_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

}