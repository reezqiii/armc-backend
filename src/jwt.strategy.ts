import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { PortalUserPermissionService } from "portal_user_permission/user_permission.service";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "portal_user_db/user.entity";

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
      secretOrKey: process.env.JWT_SECRET || "defaultSecret",
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.userRepo.findOne({
        where: { id_user: payload.id_user, status_user: 1 },
        relations: ["role", "department", "position", "project"],
      });

      if (!user) return null;

      const permission_ids = await this.userPermService.getPermissionIds(
        user.id_user,
        user.id_role,
      );

      return {
        id_user: user.id_user,
        full_name: user.full_name,
        id_role: user.id_role,
        role_name: user.role?.role_name ?? null,
        permission_ids,
      };
    } catch (err) {
      console.error("=== ERROR IN JWT VALIDATE ===", err);
      return null;
    }
  }
}
