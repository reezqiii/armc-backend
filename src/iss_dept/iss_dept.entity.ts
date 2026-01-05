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

  @Column({ name: 'access_oti', type: 'int', nullable: true })
  access_oti: number;

  @Column({ name: 'date_open_oti', type: 'varchar', length: 50, nullable: true })
  date_open_oti: string;

  @Column({ name: 'oti_14days', type: 'int', nullable: true })
  oti_14days: number;

  @Column({ name: 'oti_all_days', type: 'int', nullable: true })
  oti_all_days: number;

  @Column({ name: 'status', type: 'int', nullable: true })
  status: number;

  @Column({ name: 'tvs_all_day', type: 'int', nullable: true })
  tvs_all_day: number;

  @Column({ name: 'request_for_update', type: 'int', nullable: true })
  request_for_update: number;

  @Column({ name: 'is_limited', type: 'int', nullable: true })
  is_limited: number;

  @Column({ name: 'balance', type: 'int', nullable: true })
  balance: number;

  @Column({ name: 'to_date_open_oti', type: 'varchar', length: 50, nullable: true })
  to_date_open_oti: string;

  @Column({ name: 'allow_subcont', type: 'int', nullable: true })
  allow_subcont: number;

  @Column({ name: 'badge_hod', type: 'int', nullable: true })
  badge_hod: number;

  @Column({ name: 'dept_code', type: 'varchar', length: 50, nullable: true })
  dept_code: string;
}
