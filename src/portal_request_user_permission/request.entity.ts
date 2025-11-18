import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../portal_user_db/user.entity';
import { Company } from 'portal_company/company.entity';
import { NavMenu } from 'portal_nav_menu/menu.entity';
import { IssDept } from 'iss_dept/iss_dept.entity';
import { Position } from 'iss_design_new/position.entity';
import { IssProject } from 'iss_project/iss_project.entity';
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

  @Column({ name: 'id_company', type: 'int', nullable: true })
  id_company: number;

  @Column({ name: 'approval_hod_by', type: 'int', nullable: true })
  approval_hod_by_id: number;

  @Column({ name: 'approval_it_hod_by', type: 'int', nullable: true })
  approval_it_hod_by_id: number;

  @Column({ name: 'approval_lead_it_by', type: 'int', nullable: true })
  approval_lead_it_by_id: number;

  @Column({ name: 'access_yard_company', type: 'varchar', nullable: true })
  access_yard_company: string;

  @Column({ name: 'access_nav_menu', type: 'varchar', nullable: true })
  access_nav_menu: string;

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

  @ManyToOne(() => NavMenu, { nullable: true })
  @JoinColumn({ name: 'access_nav_menu' })
  nav_menu: NavMenu;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'id_company' })
  company: Company;


}

