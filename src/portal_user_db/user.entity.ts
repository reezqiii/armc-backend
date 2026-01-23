import { Company } from "portal_company/company.entity";
import { PortalDepartment } from "portal_department/entities/portal_department.entity";
import { PortalProject } from "portal_project/entities/portal_project.entity";
import { PortalRole } from "portal_role_db/entities/portal_role_db.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";

@Entity({ name: "portal_user_db" })
export class User {
  @PrimaryGeneratedColumn({ name: "id_user", type: "int" })
  id_user: number;

  @Column({ name: "created_date", type: "timestamp", nullable: true })
  created_date: Date;

  @Column({ name: "full_name", type: "varchar", length: 200, nullable: true })
  full_name: string;

  @Column({ name: "email", type: "varchar", length: 200, nullable: true })
  email: string;

  @Column({ name: "badge_no", type: "varchar", length: 200, nullable: true })
  badge_no: string;

  @Column({ name: "username", type: "varchar", length: 200, nullable: true })
  username: string;

  @Column({ name: "password", type: "varchar", length: 200, nullable: true })
  password: string;

  @Column({ name: "status_user", type: "int", nullable: true })
  status_user: number;

  @Column({ name: "update_by", type: "int", nullable: true })
  update_by: number;

  @ManyToOne(() => PortalDepartment, { nullable: true })
  @JoinColumn({ name: "department" }) 
  department: PortalDepartment;

  @ManyToOne(() => PortalProject, { nullable: true })
  @JoinColumn({ name: "project_id" }) 
  project: PortalProject;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: "company" }) 
  company: Company;

  @ManyToOne(() => PortalRole, { nullable: true })
  @JoinColumn({ name: "id_role" }) 
  role: PortalRole;
}
