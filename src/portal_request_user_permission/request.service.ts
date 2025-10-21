import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RequestEntity } from './request.entity';
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
  ) { }
  

  // Create new request
  async create(data: Partial<RequestEntity>): Promise<RequestEntity> {
    const request = this.requestRepository.create(data);
    return this.requestRepository.save(request);
  }

  // Get all requests
  async findAll(): Promise<RequestEntity[]> {
    return this.requestRepository.find();
  }

  // Get single request by id_request
  async findOne(id: number): Promise<RequestEntity> {
    return this.requestRepository.findOne({ where: { id_request: id } });
  }

  // Hapus request berdasarkan id_request
  async remove(id: number): Promise<{ deleted: boolean }> {
    const result = await this.requestRepository.delete({ id_request: id });
    return { deleted: result.affected > 0 };
  }

  