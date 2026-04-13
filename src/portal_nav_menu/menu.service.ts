import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavMenu } from './menu.entity';

@Injectable()
export class NavMenuService {
  constructor(
    @InjectRepository(NavMenu)
    private readonly navMenuRepository: Repository<NavMenu>,
  ) {}

  async findAll(): Promise<NavMenu[]> {
    return this.navMenuRepository.find({
      order: { application_name: 'ASC' }, 
    });
  }

  async findOne(id: number): Promise<NavMenu> {
    return this.navMenuRepository.findOne({ where: { id_application: id } });
  }

  async create(data: Partial<NavMenu>): Promise<NavMenu> {
    const newNav = this.navMenuRepository.create(data);
    return this.navMenuRepository.save(newNav);
  }

  async update(id: number, data: Partial<NavMenu>): Promise<NavMenu> {
    await this.navMenuRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.navMenuRepository.delete(id);
  }
}
