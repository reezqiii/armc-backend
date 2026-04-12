import { PartialType } from '@nestjs/swagger';
import { CreatePortalPositionDto } from './create-portal_position.dto';

export class UpdatePortalPositionDto extends PartialType(CreatePortalPositionDto) {}
