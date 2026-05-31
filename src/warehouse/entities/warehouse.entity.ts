import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("app_warehouse_item")
export class Warehouse {
  @PrimaryGeneratedColumn({ name: "id_item", type: "int4" })
  id_item: number;

  @Column({ name: "item_code", type: "varchar", length: 50, unique: true })
  item_code: string;

  @Column({ name: "item_name", type: "varchar", length: 255 })
  item_name: string;

  @Column({ name: "category", type: "varchar", length: 100, nullable: true })
  category: string;

  @Column({ name: "quantity", type: "int4", default: 0 })
  quantity: number;

  @Column({ name: "unit", type: "varchar", length: 20, default: "Pcs" })
  unit: string;

  @Column({ name: "location", type: "varchar", length: 100, nullable: true })
  location: string;
  
  @Column({ name: "status", type: "int4", default: 1 })
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
