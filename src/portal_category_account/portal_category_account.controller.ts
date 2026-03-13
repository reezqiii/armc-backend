import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PortalCategoryAccountService } from './portal_category_account.service';
import { CreatePortalCategoryAccountDto } from './dto/create-portal_category_account.dto';
import { UpdatePortalCategoryAccountDto } from './dto/update-portal_category_account.dto';

@Controller('category-account')
export class PortalCategoryAccountController {
  constructor(private readonly portalCategoryAccountService: PortalCategoryAccountService) {}

  @Post()
  create(@Body() createPortalCategoryAccountDto: CreatePortalCategoryAccountDto) {
    return this.portalCategoryAccountService.create(createPortalCategoryAccountDto);
  }

  @Get()
  findAll() {
    return this.portalCategoryAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portalCategoryAccountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortalCategoryAccountDto: UpdatePortalCategoryAccountDto) {
    return this.portalCategoryAccountService.update(+id, updatePortalCategoryAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portalCategoryAccountService.remove(+id);
  }
}
