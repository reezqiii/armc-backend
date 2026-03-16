import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

@Entity({ name: "portal_project" })
export class PortalProject {
  @PrimaryGeneratedColumn({ name: "id_project", type: "int" })
  id_project: number;

  @Column({ name: "project_name", type: "varchar", length: 250 })
  project_name: string;

  @Column({ name: "created_date", type: "timestamp", nullable: true })
  created_date: Date;

  @Column({ name: "updated_date", type: "timestamp", nullable: true })
  updated_date: Date;
}