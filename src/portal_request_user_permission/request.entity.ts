import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../portal_user_db/user.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { Position } from "portal_position/entities/portal_position.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { NavMenu } from "portal_nav_menu/menu.entity";

@Entity("portal_request_user_permission")
export class RequestEntity {
  @PrimaryGeneratedColumn({ name: "id_request", type: "int4" })
  id_request: number;

  @Column({ name: "id_project", type: "int4", nullable: true })
  id_project: number;

  @Column({ name: "id_department", type: "int4", nullable: true })
  id_department: number;

  @Column({ name: "full_name", type: "varchar", nullable: true })
  full_name: string;

  @Column({ name: "badge_no", type: "varchar", nullable: true })
  badge_no: string;

  @Column({ name: "email", type: "varchar", nullable: true })
  email: string;

  @Column({ name: "request_reason", type: "text", nullable: true })
  request_reason: string;

  @Column({ name: "request_status", type: "int4", default: 0 })
  request_status: number;

  @Column({ name: "rejected_it_remarks", type: "text", nullable: true })
  rejected_it_remarks: string;

  @Column({ name: "rejected_hod_remarks", type: "text", nullable: true })
  rejected_hod_remarks: string;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "status_active", type: "int4", default: 1 })
  status_active: number;

  @Column({ name: "canceled_by", type: "int4", nullable: true })
  canceled_by: number;

  @Column({ name: "approval_it_hod_by", type: "int4", nullable: true })
  approval_it_hod_by_id: number;

  @Column({ name: "approval_hod_by", type: "int4", nullable: true })
  approval_hod_by_id: number;

  @Column({ name: "category_account", type: "int4", nullable: true })
  category_account: number;

  @Column({ name: "id_position", type: "int4", nullable: true })
  id_position: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;

  @Column({ name: "id_application", type: "int4", nullable: true })
  id_application: number;

  @ManyToOne(() => PortalProject)
  @JoinColumn({ name: "id_project" })
  project: PortalProject;

  @ManyToOne(() => PortalDepartment)
  @JoinColumn({ name: "id_department" })
  department: PortalDepartment;

  @ManyToOne(() => Position)
  @JoinColumn({ name: "id_position" })
  position: Position;

  @ManyToOne(() => NavMenu)
  @JoinColumn({ name: "id_application" })
  application: NavMenu;

  @ManyToOne(() => User)
  @JoinColumn({ name: "approval_hod_by" })
  approval_hod_by: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "approval_it_hod_by" })
  approval_it_hod_by: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  created_by_user: User;
}
