import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm";

@Entity("portal_position")
export class Position {
  @PrimaryGeneratedColumn({ name: "id_position", type: "int4" })
  id_position: number;

  @Column({ type: "varchar", length: 250 })
  position_name: string;

  @Column({ type: "int4", nullable: true })
  id_role: number;

  @Column({ type: "int4", default: 1 })
  is_active: number;

  @Column({ type: "int4", nullable: true })
  created_by: number;

  @Column({ type: "int4", nullable: true })
  updated_by: number;

  @Column({ type: "int4", nullable: true })
  deleted_by: number;

  @ManyToOne(() => PortalRole)
  @JoinColumn({ name: "id_role" })
  role: PortalRole;
}
