import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { NavMenuService } from './menu.service';
import { NavMenu } from './menu.entity';
import { Public } from 'public.decorator';


@Controller('portal_nav_menu')
export class NavMenuController {
  constructor(private readonly navMenuService: NavMenuService) { }

  @Public()
  @Get('list')
  async findAll() {
    return this.navMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<NavMenu> {
    return this.navMenuService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<NavMenu>): Promise<NavMenu> {
    return this.navMenuService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<NavMenu>): Promise<NavMenu> {
    return this.navMenuService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.navMenuService.remove(id);
  }
}
