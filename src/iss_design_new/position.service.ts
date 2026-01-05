import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './position.entity';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position, 'db_iss')
    private readonly _positionRepo: Repository<Position>,
  ) {}

  async findAll(): Promise<Position[]> {
    try {
      return await this._positionRepo.find({ order: { design_desc: 'ASC' } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findById(id: number): Promise<Position> {
    try {
      const pos = await this._positionRepo.findOne({ where: { design_id: id } });
      if (!pos) throw new NotFoundException(`Position with ID ${id} not found`);
      return pos;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async create(positionData: Partial<Position>): Promise<Position> {
    try {
      const newPosition = this._positionRepo.create(positionData);
      return await this._positionRepo.save(newPosition);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, positionData: Partial<Position>): Promise<Position> {
    try {
      await this._positionRepo.update({ design_id: id }, positionData);
      return this.findById(id);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this._positionRepo.delete({ design_id: id });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
