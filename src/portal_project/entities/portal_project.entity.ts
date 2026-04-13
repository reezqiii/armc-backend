import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "portal_project" })
export class PortalProject {
  @PrimaryGeneratedColumn({ name: "id_project", type: "int" })
  id_project: number;

  @Column({ name: "project_name", type: "varchar", length: 250 })
  project_name: string;

  @Column({ name: "is_active", type: "int", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deleted_by: number;
}
