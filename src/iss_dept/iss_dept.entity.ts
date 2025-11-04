import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('iss_dept')
export class IssDept {
  @PrimaryGeneratedColumn({ name: 'dept_id', type: 'int' })
  dept_id: number;

  @Column({ name: 'hod', type: 'varchar', length: 250, nullable: true })
  hod: string;

  @Column({ name: 'hod_mail', type: 'varchar', length: 250, nullable: true })
  hod_mail: string;

  @Column({ name: 'dept', type: 'varchar', length: 50, nullable: true })
  dept: string;

  @Column({ name: 'badge', type: 'varchar', length: 50, nullable: true })
  badge: string;
}
