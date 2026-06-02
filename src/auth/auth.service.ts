import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { AuthDTO } from "./DTO/auth.dto";
import * as crypto from "crypto";
import { User } from "../portal_user_db/user.entity";
import { EmailService } from "../email/email.service";
import { PortalUserPermissionService } from "portal_user_permission/user_permission.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly _user: Repository<User>,
    private readonly emailService: EmailService,
    private readonly userPermService: PortalUserPermissionService,
  ) {}

  private hashMd5(data: string): string {
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async login(authDTO: AuthDTO) {
    const { username, password } = authDTO;

    const login = await this._user.findOne({
      where: { username, status_user: 1 },
      relations: ["role", "department", "position"],
    });

    if (!login) throw new UnauthorizedException("Invalid username or password");

    const hashedPassword = this.hashMd5(password);
    if (login.password !== hashedPassword) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const positionRoleId = login.position?.id_role;

    const permission_ids = await this.userPermService.getPermissionIds(
      login.id_user,
      positionRoleId,
    );

    const payload = { id_user: login.id_user };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      user: {
        id: login.id_user,
        full_name: login.full_name,
        badge_no: login.badge_no,
        department_id: login.id_department,
        department_name: login.department?.name_of_department ?? "-",
        position_name: login.position?.position_name ?? "-",
        role_id: positionRoleId, 
        role_name: login.position?.role?.role_name ?? null,
        permission_ids,
      },
    };
  }

  async forgotPassword(username: string, email: string) {
    const user = await this._user.findOne({
      where: {
        username: ILike(username.trim()),
        status_user: 1,
      },
      select: ["id_user", "full_name", "username", "email", "status_user"],
    });

    if (!user) throw new BadRequestException("Username not found or inactive");

    if (!user.email)
      throw new BadRequestException("No email registered for this account");

    if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new BadRequestException("Email does not match our records");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    await this._user.update(
      { id_user: user.id_user },
      {
        reset_token: resetToken,
        reset_token_expired: expiredAt,
      },
    );

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
    if (user.reset_token_expired && user.reset_token_expired < now) {
      throw new BadRequestException("Token has expired");
    }
    await this._user.update(
      { id_user: user.id_user },
      {
        password: this.hashMd5(new_password),
        reset_token: null,
        reset_token_expired: null,
      },
    );

    return { success: true, message: "Password has been reset successfully" };
  }
}
