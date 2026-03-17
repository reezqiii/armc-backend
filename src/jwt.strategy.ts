import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { PortalUserPermissionService } from 'portal_user_permission/user_permission.service';
import { InjectRepository } from '@nestjs/typeorm';
import { requestStorage } from 'portal_request_user_permission/subscribers/async_local_storage';
import { User } from 'portal_user_db/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly userPermService: PortalUserPermissionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'defaultSecret',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepo.findOne({
      where: { id_user: payload.id_user, status_user: 1 },
    });

    if (!user) return null;

    const store = requestStorage.getStore();
    if (store) {
      store.userId = user.id_user;
    }

    const rawPermissions = await this.userPermService.getUserPermissionsForApp(
      user.id_user,
      32
    );

    const permissions = rawPermissions.map(p => Number(p.index_key));


    return {
      id_user: user.id_user,
      full_name: user.full_name,
      permissions: permissions,
    };
  }
}
