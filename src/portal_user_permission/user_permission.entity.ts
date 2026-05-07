import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "portal_user_db/user.entity"; 
import { PortalPermission } from "portal_permission/permission.entity";

@Entity("portal_user_permission")
export class PortalUserPermission {
  @PrimaryGeneratedColumn({ name: "id", type: "int4" })
  id: number;

  @Column({ name: "id_user", type: "int4" })
  id_user: number;

  @Column({ name: "id_portal_permission", type: "int4" })
  id_portal_permission: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_user" })
  user: User;

  @ManyToOne(() => PortalPermission, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_portal_permission" })
  permission: PortalPermission;
}
