import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('portal_nav_menu')
export class NavMenu {
  @PrimaryGeneratedColumn({ name: 'id_application' })
  id_application: number;

  @Column({ name: 'application_name', type: 'varchar', length: 200 })
  application_name: string;
}