import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("portal_nav_menu")
export class NavMenu {
  @PrimaryGeneratedColumn({ name: "id_application", type: "int4" })
  id_application: number;

  @Column({
    name: "application_name",
    type: "varchar",
    length: 200,
    nullable: true,
  })
  application_name: string;

  @Column({ name: "is_active", type: "int4", default: 1, nullable: true })
  is_active: number;

  @Column({ name: "created_by", type: "int4", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int4", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int4", nullable: true })
  deleted_by: number;
}
