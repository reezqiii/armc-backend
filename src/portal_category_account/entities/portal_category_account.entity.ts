import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("master_category_account")
export class CategoryAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "int", nullable: true })
  created_by: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_date: Date;

  @Column({ type: "int", default: 1 })
  status_active: number;

  @Column({ type: "boolean", default: true })
  access_yard_required: boolean;

  @Column({ type: "boolean", default: true })
  application_required: boolean;
}
