import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'iss_design_new' })
export class Position {
  @PrimaryGeneratedColumn({ name: 'design_id', type: 'int' })
  design_id: number;

  @Column({ name: 'design_desc', type: 'varchar', length: 50, nullable: false })
  design_desc: string;
}
