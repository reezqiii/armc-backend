import { IsArray, isArray, IsOptional, IsString } from "class-validator";

export class sendEmailDto {
  @IsString()
  content: string

  @IsString()
  subject: string

  @IsArray()
  email_to: string[]

  @IsOptional()
  @IsArray()
  email_cc?: string[]

  @IsOptional()
  @IsArray()
  email_bcc?: string[]

}
