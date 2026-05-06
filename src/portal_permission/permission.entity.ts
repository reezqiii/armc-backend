import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("portal_permission")
export class PortalPermission {
  @PrimaryGeneratedColumn({ name: "id_permission", type: "int4" })
  id_permission: number;

  @Column({ name: "permission_name", type: "varchar", nullable: true })
  permission_name: string;

  @Column({
    name: "permission_group",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  permission_group: string;

  @Column({ name: "is_active", type: "int4", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;
}
