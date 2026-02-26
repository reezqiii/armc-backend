import { User } from "portal_user_db/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("portal_request_user_permission_attachments")
export class PortalSftp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  id_user: number;

  @Column({ nullable: true })
  id_request: number;

  @Column({ nullable: true })
  name_file: string;

  @Column({ type: "timestamp", nullable: true })
  upload_date: Date;

  @Column({ nullable: true })
  remarks: string;

  @Column({ type: "int", default: 0 })
  status_active: number;

  // relasi
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "id_user", referencedColumnName: "id_user" })
  user: User;
}
