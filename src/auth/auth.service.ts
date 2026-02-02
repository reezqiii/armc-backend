import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../portal/user.entity';
import { Repository } from 'typeorm';
import * as md5 from 'md5';
import { AuthDTO } from './DTO/auth.dto';
import { AesEcbService } from '../crypto/aes-ecb.service';
import { PortalUserPermissionService } from 'portal_user_permission/user_permission.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) 
    private readonly _user: Repository<User>,
    private readonly aesEcb: AesEcbService,
    private readonly userPermService: PortalUserPermissionService,
  ) { }

  async login(authDTO: AuthDTO) {
    try {
      const { id_user } = authDTO;
      console.log('id_user (raw):', authDTO.id_user);
      const decrypted = this.aesEcb.decryptBase64Url(id_user);
      const idUserNum = Number.parseInt(decrypted, 10);
      const login = await this._user.findOne({
        where: {
          id_user: idUserNum,
          status_user: 1,
        },
      });
      const permissions = await this.userPermService.getUserPermissionsForApp(
        login.id_user,
        31 
      );
      const payload = { id_user: login?.id_user };
      const token = this.jwtService.sign(payload)
      return {
        success: true,
        token: token,
        user: {
          id: login?.id_user,
          full_name: login?.full_name,
          permissions: permissions,
        },
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
