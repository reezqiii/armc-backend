import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('portal_permission')
export class PortalPermission {
  @PrimaryGeneratedColumn()
  id_app_permission: number;

  @Column({ type: 'varchar', nullable: true })
  permission_name: string;

  @Column({ type: 'varchar', nullable: true })
  index_key: string;

  @Column({ type: 'timestamp', nullable: true })
  created_date: Date;

  @Column({ type: 'int', nullable: true })
  id_permission: number;

  @Column({ type: 'varchar', nullable: true })
  permission_group: string;
}
