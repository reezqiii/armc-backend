import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { Position } from "portal_position/entities/portal_position.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";

@Entity({ name: "portal_user_db" })
export class User {
  @PrimaryGeneratedColumn({ name: "id_user", type: "int" })
  id_user: number;

  @Column({ name: "created_date", type: "timestamp", nullable: true })
  created_date: Date;

  @Column({ name: "full_name", type: "varchar", length: 200, nullable: true })
  full_name: string;

  @Column({ name: "email", type: "varchar", length: 200, nullable: true })
  email: string;

  @Column({ name: "badge_no", type: "varchar", length: 200, nullable: true })
  badge_no: string;

  @Column({ name: "username", type: "varchar", length: 200, nullable: true })
  username: string;

  @Column({ name: "password", type: "varchar", length: 200, nullable: true })
  password: string;

  @Column({ name: "status_user", type: "int", nullable: true })
  status_user: number;

  @Column({ name: "update_by", type: "int", nullable: true })
  update_by: number;

  @Column({
    name: "addon_project",
    type: "varchar",
    length: 200,
    nullable: true,
  })
  addon_project: string;

  @Column({ name: "id_position", type: "int", nullable: true })
  id_position: number; // Kolom fisik untuk menyimpan ID

  @Column({ name: "id_role", type: "int", nullable: true })
  id_role: number;

  @Column({ name: "id_department", type: "int", nullable: true })
  id_department: number;

  @Column({ name: "id_project", type: "int", nullable: true })
  id_project: number;

  @Column({ name: "reset_token", type: "varchar", length: 200, nullable: true })
  reset_token: string;

  @Column({ name: "reset_token_expired", type: "timestamp", nullable: true })
  reset_token_expired: Date;

  @Column({ name: "last_update_password", type: "timestamp", nullable: true })
  last_update_password: Date;

  @ManyToOne(() => PortalProject)
  @JoinColumn({ name: "id_project" }) // Pastikan ini sama dengan DB
  project: PortalProject;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: "id_position" })
  position: Position;

  @ManyToOne(() => PortalRole, { nullable: true })
  @JoinColumn({ name: "id_role" })
  role: PortalRole;

  @ManyToOne(() => PortalDepartment, { nullable: true })
  @JoinColumn({ name: "id_department" })
  department: PortalDepartment;
}
