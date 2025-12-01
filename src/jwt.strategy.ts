import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { PortalUserPermissionService } from 'portal_user_permission/user_permission.service';
import { User } from 'portal/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

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

    const rawPermissions = await this.userPermService.getUserPermissionsForApp(
      user.id_user,
      31
    );

    const permissions = rawPermissions.map(p => Number(p.index_key));


    return {
      id_user: user.id_user,
      full_name: user.full_name,
      permissions: permissions,
    };
  }
}
