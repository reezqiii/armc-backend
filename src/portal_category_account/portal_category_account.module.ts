import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalCategoryAccountService } from './portal_category_account.service';
import { PortalCategoryAccountController } from './portal_category_account.controller';
import { CategoryAccount } from './entities/portal_category_account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryAccount]), 
  ],
  controllers: [PortalCategoryAccountController],
  providers: [PortalCategoryAccountService],
})
export class PortalCategoryAccountModule {}