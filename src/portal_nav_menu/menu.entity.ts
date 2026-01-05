import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('portal_nav_menu')
export class NavMenu {
  @PrimaryGeneratedColumn({ name: 'id_application' })
  id_application: number;

  @Column({ name: 'navigation_menu', type: 'varchar', length: 250 })
  navigation_menu: string;

  @Column({ name: 'application_name', type: 'varchar', length: 200 })
  application_name: string;

  @Column({ name: 'access_role', type: 'int', nullable: true })
  access_role: number;

  @Column({ name: 'menu_position', type: 'varchar', length: 200, nullable: true })
  menu_position: string;

}
