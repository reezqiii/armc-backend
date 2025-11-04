import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IssDept } from '../iss_dept/iss_dept.entity';
import { IssProject } from '../iss_project/iss_project.entity';
import { Position } from '../iss_design_new/position.entity';

@Entity('iss_employee')
export class IssEmployee {
  @PrimaryGeneratedColumn({ name: 'badge_id', type: 'int' })
  badge_id: number;

  @Column({ name: 'badge', type: 'int' })
  badge: number;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name: string;

  @Column({ name: 'dept_id', type: 'int', nullable: true })
  dept_id: number;

  @Column({ name: 'project_id', type: 'int', nullable: true })
  project_id: number;

  @Column({ name: 'design_id', type: 'int', nullable: true })
  design_id_new: number;

  @ManyToOne(() => IssDept, { nullable: true })
  @JoinColumn({ name: 'dept_id', referencedColumnName: 'dept_id' })
  department: IssDept;

  @ManyToOne(() => IssProject, { nullable: true })
  @JoinColumn({ name: 'project_id', referencedColumnName: 'project_id' })
  project: IssProject;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: 'design_id_new', referencedColumnName: 'design_id' })
  position: Position;

}
