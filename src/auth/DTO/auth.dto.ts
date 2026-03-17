import { IsString } from "class-validator";

export class AuthDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}