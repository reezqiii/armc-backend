import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber } from "class-validator";

export class ServerSideLogDTO {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  size?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  table?: string;

  @IsOptional()
  @Type(() => Number)
  type?: number;

  @IsOptional()
  @Type(() => Number)
  user?: number;

  @IsOptional()
  @Type(() => Number)
  id_application?: number;

  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @IsString()
  after?: string;

  @IsOptional()
  @Type(() => Number)
  index?: number;

  @IsOptional()
  @IsString() 
  date?: string;

  @IsOptional()
  @Type(() => Number)
  id?: number;
}
