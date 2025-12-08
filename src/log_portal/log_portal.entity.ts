import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('log_portal')
export class LogPortalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  table: string;

  @Column({ type: 'int', nullable: true })
  index: number;

  @Column({ type: 'text', nullable: true })
  before: string;

  @Column({ type: 'text', nullable: true })
  after: string;

  @Column({ type: 'int', nullable: true })
  user: number;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'varchar', nullable: true })
  column: string;

  @Column({ type: 'int', nullable: true })
  type: number; 
  // 1 = UPDATE
  // 2 = INSERT
  // 3 = DELETE (opsional)

  @Column({ type: 'int', nullable: true })
  id_application: number;
}
