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

  // Server-side list for pagination, filtering, sorting
  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const take = size;
    const skip = page * take;

    const qb: SelectQueryBuilder<RequestEntity> = this.requestRepository.createQueryBuilder('request');

    // Mapping kolom frontend ke kolom database
    const columnMap: Record<string, string> = {
      id_department: 'request.id_department',
      id_role: 'request.id_role',
      id_project: 'request.id_project',
    };

    // Apply filter/search
    if (search) {
      Object.keys(search).forEach((key) => {
        const dbColumn = columnMap[key];
        if (dbColumn) {
          qb.andWhere(`${dbColumn}::text ILIKE :${key}`, { [key]: `%${search[key]}%` });
        }
      });
    }

    // Apply sorting
    if (sort && sort.length > 0) {
      const [sortColumn, sortOrder] = sort[0].split(',');
      const dbColumn = columnMap[sortColumn] ?? 'request.id_request';
      qb.orderBy(dbColumn, sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
    } else {
      qb.orderBy('request.id_request', 'DESC');
    }

    // Pagination
    qb.skip(skip).take(take);

    const [data, totalCount] = await qb.getManyAndCount();
    const total_pages = Math.ceil(totalCount / take);

    return { data, total_pages };
  }
}
