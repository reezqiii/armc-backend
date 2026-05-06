import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryAccount } from "./entities/portal_category_account.entity";
import { CreatePortalCategoryAccountDto } from "./dto/create-portal_category_account.dto";
import { UpdatePortalCategoryAccountDto } from "./dto/update-portal_category_account.dto";
import { ServerSideDTO } from "DTO/dto.serverside";

@Injectable()
export class PortalCategoryAccountService {
  constructor(
    @InjectRepository(CategoryAccount)
    private readonly categoryRepo: Repository<CategoryAccount>,
  ) {}

  async create(dto: CreatePortalCategoryAccountDto, userId?: number) {
    const category = this.categoryRepo.create({
      category_name: dto.name,
      is_active: 1,
      created_by: userId,
    });
    return this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      where: { is_active: 1 },
      order: { id_category_account: "ASC" },
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id_category_account: id },
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async update(
    id: number,
    dto: UpdatePortalCategoryAccountDto,
    userId?: number,
  ) {
    await this.findOne(id);

    const updateData: any = {
      updated_by: userId,
    };
    if (dto.name) updateData.category_name = dto.name;

    await this.categoryRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number, userId?: number) {
    const category = await this.findOne(id);
    category.is_active = 0;
    category.deleted_by = userId;
    return this.categoryRepo.save(category);
  }

  async serverSideList(queryDto: ServerSideDTO) {
    const { sort, search, page = 0, size = 10 } = queryDto;
    const qb = this.categoryRepo
      .createQueryBuilder("cat")
      .where("cat.is_active = :active", { active: 1 });

    const columnMap: Record<string, string> = {
      id: "cat.id_category_account",
      name: "cat.category_name",
    };

    if (sort) {
      const [col, dir] = sort.split(",");
      const column = columnMap[col] || columnMap["name"];
      qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
    }

    if (search) {
      const searchObj = JSON.parse(search);
      Object.keys(searchObj).forEach((key) => {
        const column = columnMap[key];
        if (column) {
          qb.andWhere(`${column} ILIKE :${key}`, {
            [key]: `%${searchObj[key]}%`,
          });
        }
      });
    }

    const [data, total] = await qb
      .take(size)
      .skip(page * size)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit: size,
      total_pages: Math.ceil(total / size),
    };
  }
}
