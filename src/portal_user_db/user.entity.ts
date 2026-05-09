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
  @PrimaryGeneratedColumn({ name: "id_user", type: "int4" })
  id_user: number;

  @Column({ name: "full_name", type: "varchar", length: 200 })
  full_name: string;

  @Column({ name: "badge_no", type: "varchar", length: 200, nullable: true })
  badge_no: string;

  @Column({ name: "username", type: "varchar", length: 200, unique: true })
  username: string;

  @Column({ name: "password", type: "varchar", length: 200 })
  password: string;

  @Column({
    name: "email",
    type: "varchar",
    length: 200,
    unique: true,
    nullable: true,
  })
  email: string;

  @Column({ name: "id_department", type: "int4", nullable: true })
  id_department: number;

  @Column({ name: "id_project", type: "int4", nullable: true })
  id_project: number;

  @Column({ name: "id_role", type: "int4", nullable: true })
  id_role: number;

  @Column({ name: "id_position", type: "int4", nullable: true })
  id_position: number;

  @Column({
    name: "addon_project",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  addon_project: string;

  @Column({ name: "status_user", type: "int4", default: 1 })
  status_user: number;

  @Column({ name: "reset_token", type: "varchar", length: 200, nullable: true })
  reset_token: string;

  @Column({ name: "reset_token_expired", type: "timestamp", nullable: true })
  reset_token_expired: Date;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
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
