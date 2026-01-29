import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "portal_role_db" })
export class PortalRole {
  @PrimaryGeneratedColumn({ name: "id_role", type: "int" })
  id_role: number;

  @Column({ name: "role_name", type: "varchar", length: 200 })
  role_name: string;
}
