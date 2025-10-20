import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './dto.create-request.js';

export class UpdateRequestDto extends PartialType(CreateRequestDto) { }
