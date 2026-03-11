import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDTO } from './DTO/auth.dto';
import { Public } from '../public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly _auth: AuthService) {}

  @Public()
  @Post('validate')
  async validate(@Body() authDTO: AuthDTO) {
    return this._auth.login(authDTO);
  }
}
