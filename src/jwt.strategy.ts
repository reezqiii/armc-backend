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
      });
      if (!user) return null;

      let permissions_key: string[] = [];
      try {
        permissions_key = await this.getRolePermissionKeys(user.id_user);
      } catch (roleErr) {
        console.error("=== ERROR getRolePermissionKeys ===", roleErr.message);
        console.error(roleErr.stack);
      }

      return {
        id_user: user.id_user,
        full_name: user.full_name,
        department: user.department,
        permissions_key,
      };
    } catch (err) {
      console.error("=== ERROR IN JWT VALIDATE ===", err);
      return null;
    }
  }

  private async getRolePermissionKeys(id_user: number): Promise<string[]> {
    try {
      const rolePerms = await this.userRepo.query(
        `
        SELECT pp.index_key
        FROM portal_user_db u
        JOIN portal_role_db r ON r.id_role = u.id_role
        JOIN role_permission rp ON rp.id_role = r.id_role
        JOIN portal_permission pp ON pp.id_permission = rp.id_permission
        WHERE u.id_user = $1
        AND pp.index_key IS NOT NULL
        AND r.is_active = 1
        `,
        [id_user],
      );

      const userSpecificPerms = await this.userRepo.query(
        `
        SELECT permission_key as index_key
        FROM portal_user_permission
        WHERE id_user = $1
        AND permission_key IS NOT NULL
        `,
        [id_user],
      );

      const roleKeys = rolePerms.map((r: any) => r.index_key);
      const userKeys = userSpecificPerms.map((r: any) => r.index_key);
      return [...new Set([...roleKeys, ...userKeys])];
    } catch (err) {
      console.error("getRolePermissionKeys error:", err.message);
      return [];
    }
  }
}
