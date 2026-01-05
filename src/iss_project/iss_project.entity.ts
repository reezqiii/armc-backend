import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('iss_project')
export class IssProject {
  @PrimaryGeneratedColumn({ name: 'project_id', type: 'int' })
  project_id: number;

  @Column({ name: 'project_desc', type: 'varchar', length: 50, nullable: true })
  project_desc: string;

  @Column({ name: 'project_mngr', type: 'varchar', length: 50, nullable: true })
  project_mngr: string;

  @Column({ name: 'status', type: 'int', nullable: true })
  status: number;
}
