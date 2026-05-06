import { Controller, Post, Body, Get, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDTO } from "./DTO/auth.dto";
import { Public } from "../public.decorator";
import { JwtAuthGuard } from "jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly _auth: AuthService) {}

  @Public()
  @Post("login")
  async validate(@Body() authDTO: AuthDTO) {
    return this._auth.login(authDTO);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return req.user;
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
