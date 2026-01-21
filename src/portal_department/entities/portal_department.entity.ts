import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'portal_department' })
export class PortalDepartment {
  @PrimaryGeneratedColumn({ name: 'id_department', type: 'int' })
  id_department: number;

  @Column({ name: 'name_of_department', type: 'varchar', length: 200 })
  name_of_department: string;

  @Column({ name: 'temp_iss_id', type: 'int', nullable: true })
  temp_iss_id: number;

  @Column({ name: 'status', type: 'int', nullable: true })
  status: number;

  @Column({ name: 'dept_code', type: 'varchar', length: 50, nullable: true })
  dept_code: string;

  @Column({ name: 'dept_initial', type: 'varchar', length: 50, nullable: true })
  dept_initial: string;

  @Column({ name: 'dept_for_ofi', type: 'varchar', length: 50, nullable: true })
  dept_for_ofi: string;
}
