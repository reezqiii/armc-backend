// src/portal_user_permission/user_permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("portal_user_permission")
export class PortalUserPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  id_user: number;

  @Column({ type: "varchar", nullable: true })
  id_portal_app_permission: string;

  @Column({ type: "varchar", nullable: true })
  id_portal_permission: string;

  @Column({ type: "varchar", nullable: true })
  index_key: string;

  @Column({ type: "int", nullable: true })
  create_by: number;

  @Column({ type: "timestamp", nullable: true })
  create_date: Date;

  @Column({ type: "varchar", length: 100, nullable: true }) // ← TAMBAH INI
  permission_key: string;
}
