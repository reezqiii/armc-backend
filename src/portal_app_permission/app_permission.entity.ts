import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'portal_app_permission' })
export class PortalAppPermission {
  @PrimaryGeneratedColumn({ name: 'id_application', type: 'int' })
  id_application: number;

  @Column({ name: 'app_name', type: 'varchar' })
  app_name: string;

  @Column({ name: 'created_date', type: 'timestamp' })
  created_date: Date;
}
