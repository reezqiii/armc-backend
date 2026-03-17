import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as md5 from "md5";
import { AuthDTO } from "./DTO/auth.dto";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { User } from "portal_user_db/user.entity";
import { EmailService } from "email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly _user: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async login(authDTO: AuthDTO) {
    const { username, password } = authDTO;

    const login = await this._user.findOne({
      where: { username, status_user: 1 },
    });

    if (!login) throw new UnauthorizedException("Invalid username or password");

    const hashedPassword = md5(password);
    if (login.password !== hashedPassword)
      throw new UnauthorizedException("Invalid username or password");

    const payload = { id_user: login.id_user };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      user: {
        id: login.id_user,
        full_name: login.full_name,
        permissions: [],
      },
    };
  }

  async forgotPassword(username: string, email: string) {
    const user = await this._user.findOne({
      where: { username, status_user: 1 },
      select: ["id_user", "full_name", "username", "email", "status_user"],
    });

    if (!user) throw new BadRequestException("Username not found");
    if (!user.email)
      throw new BadRequestException("No email registered for this account");

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

    // ← Tambahkan logoBase64
    const logoPath = path.join(process.cwd(), "public", "armc.png");
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");

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
      where: { reset_token: token } as any,
    });

    if (!user) throw new BadRequestException("Invalid or expired token");

    const now = new Date();
    if (user["reset_token_expired"] && user["reset_token_expired"] < now) {
      throw new BadRequestException("Token has expired");
    }

    await this._user.update({ id_user: user.id_user }, {
      password: md5(new_password),
      reset_token: null,
      reset_token_expired: null,
      last_update_password: new Date(),
    } as any);

    return { success: true, message: "Password has been reset successfully" };
  }
}
