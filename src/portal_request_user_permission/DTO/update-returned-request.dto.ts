// src/requests/dto/update-returned-request.dto.ts

import { IsOptional, IsString, IsArray, IsEmail } from "class-validator";

export class UpdateReturnedRequestDto {

  @IsOptional()
  @IsString()
  badge_no?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  department_name?: string;

  @IsOptional()
  @IsString()
  position_name?: string;

  @IsOptional()
  @IsString()
  project_name?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsArray()
  access_yard_company?: string[];

  @IsOptional()
  @IsArray()
  access_nav_menu?: number[];

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  request_reason?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
