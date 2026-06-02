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
        relations: ["department", "position", "position.role", "project"],
      });

      if (!user || !user.position) return null;

      const positionRoleId = user.position.id_role;

      const permission_ids = await this.userPermService.getPermissionIds(
        user.id_user,
        positionRoleId,
      );

      return {
        id_user: user.id_user,
        full_name: user.full_name,
        department_id: user.department?.id_department,
        position_name: user.position?.position_name ?? "-",
        id_role: positionRoleId,
        role_name: user.position.role?.role_name ?? null,
        permission_ids,
      };
    } catch (err) {
      console.error("ERROR IN JWT VALIDATE", err);
      return null;
    }
  }
}
