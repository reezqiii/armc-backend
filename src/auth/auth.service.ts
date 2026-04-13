import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthDTO } from "./DTO/auth.dto";
import * as crypto from "crypto";
import { User } from "../portal_user_db/user.entity";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly _user: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  private hashMd5(data: string): string {
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async login(authDTO: AuthDTO) {
    const { username, password } = authDTO;

    const login = await this._user.findOne({
      where: { username, status_user: 1 },
      relations: ["role", "department", "position", "project"],
    });

    if (!login) throw new UnauthorizedException("Invalid username or password");

    const hashedPassword = this.hashMd5(password);

    if (login.password !== hashedPassword)
      throw new UnauthorizedException("Invalid username or password");

    const permissions_key = await this.getRolePermissionKeys(login.id_user);

    const payload = { id_user: login.id_user };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      user: {
        id: login.id_user,
        full_name: login.full_name,
        department_id: login.id_department,
        department_name: login.department?.name_of_department ?? "-",
        position_name: login.position?.position_name ?? "-",
        role: login.role?.role_name ?? null,
        role_id: login.role?.id_role ?? null,
        project_id: login.id_project,
        project_name: login.project?.project_name ?? "-",
        project_ids: login.addon_project
          ? login.addon_project.split(";").map(Number)
          : [],
        permissions_key,
      },
    };
  }

  private async getRolePermissionKeys(id_user: number): Promise<string[]> {
    try {
      const rolePerms = await this._user.query(
        `
      SELECT pp.permission_key 
      FROM portal_user_db u
      JOIN portal_role_db r ON r.id_role = u.id_role
      JOIN role_permission rp ON rp.id_role = r.id_role
      JOIN portal_permission pp ON pp.id_permission = rp.id_permission
      WHERE u.id_user = $1 
      AND pp.permission_key IS NOT NULL -- Update filter kolom
      AND r.is_active = 1
    `,
        [id_user],
      );

      const userSpecificPerms = await this._user.query(
        `
      SELECT permission_key 
      FROM portal_user_permission
      WHERE id_user = $1 
      AND permission_key IS NOT NULL
    `,
        [id_user],
      );

      const roleKeys = rolePerms.map((r: any) => r.permission_key);
      const userKeys = userSpecificPerms.map((r: any) => r.permission_key);

      return [...new Set([...roleKeys, ...userKeys])];
    } catch (err) {
      console.error("getRolePermissionKeys error:", err.message);
      return [];
    }
  }

  async forgotPassword(username: string, email: string) {
    const user = await this._user.findOne({
      where: { username, status_user: 1 },
      select: ["id_user", "full_name", "username", "email", "status_user"],
    });

    if (!user) throw new BadRequestException("Username not found");

    if (!user.email) {
      throw new BadRequestException("No email registered for this account");
    }

    if (user.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException("Email does not match our records");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000);

    await this._user.update({ id_user: user.id_user }, {
      reset_token: resetToken,
      reset_token_expired: expiredAt,
    } as any);

    const resetLink = `${process.env.ARMC_BASE_URL}/reset_password?token=${resetToken}`;

    const htmlContent = this.emailService.renderTemplate("reset_password.ejs", {
      fullName: user.full_name,
      resetLink,
    });

    await this.emailService.sendSimpleEmail(
      user.email,
      "Reset Password - ARMC Portal",
      htmlContent,
    );

    return {
      success: true,
      message: "Reset password link has been sent to your email",
    };
  }

  async resetPassword(token: string, new_password: string) {
    const user = await this._user.findOne({
      where: { reset_token: token },
    });

    if (!user) throw new BadRequestException("Invalid or expired token");

    const now = new Date();
    if (user["reset_token_expired"] && user["reset_token_expired"] < now) {
      throw new BadRequestException("Token has expired");
    }

    await this._user.update({ id_user: user.id_user }, {
      password: this.hashMd5(new_password),
      reset_token: null,
      reset_token_expired: null,
      last_update_password: new Date(),
    } as any);

    return { success: true, message: "Password has been reset successfully" };
  }
}
