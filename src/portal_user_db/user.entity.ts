import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PortalDepartment } from "../portal_department/entities/portal_department.entity";
import { Position } from "portal_position/entities/portal_position.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";

@Entity("portal_user_db")
export class User {
  @PrimaryGeneratedColumn()
  id_user: number;

  @Column({ length: 200 })
  full_name: string;

  @Column({ length: 200, nullable: true })
  badge_no: string;

  @Column({ length: 200, unique: true })
  username: string;

  @Column({ length: 200 })
  password: string;

  @Column({ length: 200, unique: true })
  email: string;

  @Column()
  id_department: number;

  @Column()
  id_project: number;

  @Column()
  id_role: number;

  @Column()
  id_position: number;

  @Column({ nullable: true })
  addon_project: string;

  @Column({ type: "int4", default: 1 })
  status_user: number;

  @Column({ length: 200, nullable: true })
  reset_token: string;

  @Column({ type: "timestamp", nullable: true })
  reset_token_expired: Date;

  @Column({ nullable: true })
  created_by: number;

  @Column({ nullable: true })
  updated_by: number;

  @Column({ nullable: true })
  deleted_by: number;

  @ManyToOne(() => PortalRole)
  @JoinColumn({ name: "id_role" })
  role: PortalRole;

  @ManyToOne(() => PortalDepartment)
  @JoinColumn({ name: "id_department" })
  department: PortalDepartment;

  @ManyToOne(() => Position)
  @JoinColumn({ name: "id_position" })
  position: Position;

  @ManyToOne(() => PortalProject)
  @JoinColumn({ name: "id_project" })
  project: PortalProject;
}
