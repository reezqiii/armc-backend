import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "portal_project" })
export class PortalProject {
  @PrimaryGeneratedColumn({ type: "int" })
  id: number;

  @Column({ type: "varchar", length: 250 })
  project_code: string;

  @Column({ type: "varchar", length: 250 })
  project_name: string;
}
