import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("app_engineering_wo")
export class Engineering {
  @PrimaryGeneratedColumn({ name: "id_wo", type: "int4" })
  id_wo: number;

  @Column({ name: "wo_number", type: "varchar", length: 50, unique: true })
  wo_number: string;

  @Column({ name: "equipment_name", type: "varchar", length: 255 })
  equipment_name: string;

  @Column({ name: "issue_description", type: "text" })
  issue_description: string;

  @Column({ name: "priority", type: "int4", nullable: true })
  priority: number;
  
  @Column({ name: "status", type: "int4", nullable: true, default: 1 })
  status: number;

  @Column({ type: "text", nullable: true })
  remarks: string;

  @Column({ type: "int4", nullable: true })
  approved_by: number;

  @Column({ type: "int4", nullable: true })
  rejected_by: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;
}
