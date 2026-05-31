import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("app_production_batch")
export class ProductionBatch {
  @PrimaryGeneratedColumn({ type: "int4" })
  id: number;

  @Column({ type: "varchar", length: 50, unique: true })
  batch_id: string;

  @Column({ type: "varchar", length: 255 })
  product_name: string;
  
  @Column({ type: "int4", nullable: true, default: 1 })
  qc_status: number;

  @Column({ type: "text", nullable: true })
  remarks: string;

  @Column({ type: "int4", nullable: true })
  approved_by: number;

  @Column({ type: "int4", nullable: true })
  rejected_by: number;

  @Column({ type: "int4", nullable: true })
  created_by: number;

  @Column({ type: "int4", nullable: true })
  updated_by: number;

  @Column({ type: "int4", nullable: true })
  deleted_by: number;
}
