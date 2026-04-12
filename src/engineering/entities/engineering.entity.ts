import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('engineering')
export class Engineering {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  wo_number: string;

  @Column()
  equipment_name: string;

  @Column('text')
  issue_description: string;

  @Column({ default: 'Medium' }) // Low, Medium, High
  priority: string;

  @Column({ default: 'Pending' }) // Pending, In Progress, Completed
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}