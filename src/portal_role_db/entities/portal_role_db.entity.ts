import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "portal_role_db" })
export class PortalRole {
  @PrimaryGeneratedColumn({ name: "id_role", type: "int" })
  id_role: number;

  @Column({ name: "role_name", type: "varchar", length: 200 })
  role_name: string;

  @Column({ name: "is_active", type: "int", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deleted_by: number;
}
