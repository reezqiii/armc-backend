import { PartialType } from '@nestjs/swagger';
import { CreateEngineeringDto } from './create-engineering.dto';

export class UpdateEngineeringDto extends PartialType(CreateEngineeringDto) {}
