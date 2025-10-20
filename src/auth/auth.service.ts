import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../portal/user.entity';
import { Repository } from 'typeorm';
import * as md5 from 'md5';
import { AuthDTO } from './DTO/auth.dto';
import { AesEcbService } from '../crypto/aes-ecb.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User, 'portal') private readonly _user: Repository<User>,
    private readonly aesEcb: AesEcbService,
  ) {}

  async login(authDTO: AuthDTO) {
    try {
      const { id_user } = authDTO;
      const decrypted = this.aesEcb.decryptBase64Url(id_user);
      const idUserNum = Number.parseInt(decrypted, 10);
      const login = await this._user.findOne({
        where: {
          id_user: idUserNum,
          status_user: 1,
        },
      });
      const payload = { id_user: login?.id_user };
      const token = this.jwtService.sign(payload);
      return { 
        success: true,
        token: token,
        user: {
          full_name: login?.full_name,
        },
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
