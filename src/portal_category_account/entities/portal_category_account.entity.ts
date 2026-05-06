import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("portal_category_account")
export class CategoryAccount {
  @PrimaryGeneratedColumn({ name: "id_category_account", type: "int4" })
  id_category_account: number;

  @Column({
    name: "category_name",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  category_name: string;

  @Column({ name: "is_active", type: "int4", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @CreateDateColumn({
    name: "created_date",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_date: Date;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;
}
