import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEmail } from 'class-validator';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  badge_no: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  request_type: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_role?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_project?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id_department?: number;

  @IsOptional()
  @IsString()
  request_reason?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  request_status?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  created_by?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  status_active?: number;
}
