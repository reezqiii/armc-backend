import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDTO } from "./DTO/auth.dto";
import { Public } from "../public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly _auth: AuthService) {}

  @Public()
  @Post("validate")
  async validate(@Body() authDTO: AuthDTO) {
    return this._auth.login(authDTO);
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() body: { username: string; email: string }) {
    return this._auth.forgotPassword(body.username, body.email);
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() body: { token: string; new_password: string }) {
    return this._auth.resetPassword(body.token, body.new_password);
  }
}
