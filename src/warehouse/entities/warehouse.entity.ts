import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("warehouse")
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  item_code: string;

  @Column()
  item_name: string;

  @Column()
  category: string;

  @Column({ type: "integer", default: 0 })
  quantity: number;

  @Column({ default: "Pcs" })
  unit: string;

  @Column()
  location: string;

  @Column({ default: "In Stock" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
