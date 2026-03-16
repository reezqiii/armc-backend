import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'portal_department' })
export class PortalDepartment {
  @PrimaryGeneratedColumn({ name: 'id_department', type: 'int' })
  id_department: number;

  @Column({ name: 'name_department', type: 'varchar', length: 200 })
  name_department: string;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  created_date: Date;

  @Column({ name: 'updated_date', type: 'timestamp', nullable: true })
  updated_date: Date;
}