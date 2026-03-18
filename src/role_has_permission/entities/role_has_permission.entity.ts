import { PortalPermission } from "portal_permission/permission.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "role_permission" })
export class RolePermission {
  @PrimaryGeneratedColumn({ name: "id_role_permission", type: "int" })
  id_role_permission: number;

  @ManyToOne(() => PortalRole, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_role" })
  role: PortalRole;

  @ManyToOne(() => PortalPermission, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_permission" })
  permission: PortalPermission;

  @CreateDateColumn({ name: "created_date" })
  created_date: Date;

  @UpdateDateColumn({ name: "updated_date" })
  updated_date: Date;
}
