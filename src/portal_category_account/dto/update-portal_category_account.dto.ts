import { PartialType } from '@nestjs/swagger';
import { CreatePortalCategoryAccountDto } from './create-portal_category_account.dto';

export class UpdatePortalCategoryAccountDto extends PartialType(CreatePortalCategoryAccountDto) {}
