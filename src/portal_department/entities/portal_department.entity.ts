import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "portal_department" })
export class PortalDepartment {
  @PrimaryGeneratedColumn({ name: "id_department", type: "int" })
  id_department: number;

  @Column({ name: "name_of_department", type: "varchar", length: 200 })
  name_of_department: string;

  @Column({ name: "is_active", type: "int", default: 1 })
  is_active: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  created_by: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updated_by: number;

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deleted_by: number;
}
