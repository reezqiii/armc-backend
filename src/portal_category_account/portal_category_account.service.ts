import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryAccount } from "./entities/portal_category_account.entity";
import { CreatePortalCategoryAccountDto } from "./dto/create-portal_category_account.dto";
import { UpdatePortalCategoryAccountDto } from "./dto/update-portal_category_account.dto";

@Injectable()
export class PortalCategoryAccountService {
  constructor(
    @InjectRepository(CategoryAccount)
    private readonly categoryRepo: Repository<CategoryAccount>,
  ) {}

  async create(dto: CreatePortalCategoryAccountDto) {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      where: { status_active: 1 },
      order: { id: "ASC" },
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return category;
  }

  async update(id: number, dto: UpdatePortalCategoryAccountDto) {
    await this.categoryRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepo.remove(category); // hard delete
  }
}
