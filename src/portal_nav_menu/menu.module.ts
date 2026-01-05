import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavMenu } from './menu.entity';
import { NavMenuService } from './menu.service';
import { NavMenuController } from './menu.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NavMenu])],
  controllers: [NavMenuController],
  providers: [NavMenuService],
  exports: [NavMenuService],
})
export class NavMenuModule {}
