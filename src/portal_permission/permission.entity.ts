import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("portal_permission")
export class PortalPermission {
  @PrimaryGeneratedColumn({ name: "id_permission", type: "int" })
  id_permission: number;

  @Column({ name: "permission_name", type: "varchar", nullable: true })
  permission_name: string;

  @Column({ name: "index_key", type: "varchar", nullable: true })
  index_key: string;

  @Column({ name: "permission_group", type: "varchar", nullable: true })
  permission_group: string;

  @Column({ name: "is_active", type: "int", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deleted_by: number;
}
