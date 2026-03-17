import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('portal_permission')
export class PortalPermission {
  @PrimaryGeneratedColumn({ name: 'id_permission', type: 'int' })
  id_permission: number;

  @Column({ name: 'permission_name', type: 'varchar', nullable: true })
  permission_name: string;

  @Column({ name: 'index_key', type: 'varchar', nullable: true })
  index_key: string;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  created_date: Date;

  @Column({ name: 'updated_date', type: 'timestamp', nullable: true })
  updated_date: Date;
}