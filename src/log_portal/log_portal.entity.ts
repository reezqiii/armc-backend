import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('log_portal')
export class LogPortalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  table: string;

  @Column({ type: 'int', nullable: true })
  index: number;

  @Column({ type: 'jsonb', nullable: true })
  before: any;

  @Column({ type: 'jsonb', nullable: true })
  after: any;

  @Column({ type: 'int', nullable: true })
  user: number;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'int', nullable: true })
  type: number;
  // 1 = Update; 2 = Insert; 3 = Delete;

  @Column({ type: 'int', nullable: true })
  id_application: number;


}
