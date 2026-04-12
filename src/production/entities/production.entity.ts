export class Production {}
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("production_batches")
export class ProductionBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  batch_id: string;

  @Column()
  product_name: string;

  @Column({ default: "Pending" })
  qc_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
