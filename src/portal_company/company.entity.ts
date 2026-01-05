import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('portal_company')
export class Company {
  @PrimaryGeneratedColumn({ name: 'id_company' })
  id_company: number;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  company_name: string;

  @Column({ name: 'status_delete', type: 'int', default: 1 })
  status_delete: number;

}
