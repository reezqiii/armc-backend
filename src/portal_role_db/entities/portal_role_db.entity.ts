import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "portal_role_db" })
export class PortalRole {
  @PrimaryGeneratedColumn({ name: "id_role", type: "int" })
  id_role: number;

  @Column({ name: "role_name", type: "varchar", length: 200 })
  role_name: string;

  @Column({ name: "created_date", type: "timestamp", nullable: true })
  created_date: Date;

  @Column({ name: "updated_date", type: "timestamp", nullable: true })
  updated_date: Date;
}
