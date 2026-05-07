import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { PortalPermission } from "portal_permission/permission.entity";

@Entity("portal_role_permission")
export class RolePermission {
  @PrimaryGeneratedColumn({ name: "id_role_permission", type: "int4" })
  id_role_permission: number;

  @Column({ name: "id_role", type: "int4" })
  id_role: number;

  @Column({ name: "id_permission", type: "int4" })
  id_permission: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;

  @ManyToOne(() => PortalRole, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_role" })
  role: PortalRole;

  @ManyToOne(() => PortalPermission, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_permission" })
  permission: PortalPermission;
}
