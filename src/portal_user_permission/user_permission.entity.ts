import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("portal_user_permission")
export class PortalUserPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  id_user: number;

  @Column({ type: "int" })
  id_portal_permission: number;

  @Column({ type: "int", nullable: true })
  created_by: number;

  @Column({ type: "int", nullable: true })
  updated_by: number;

  @Column({ type: "int", nullable: true })
  deleted_by: number;
}
