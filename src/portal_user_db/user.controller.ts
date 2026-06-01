import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { PortalUserPermissionService } from "../portal_user_permission/user_permission.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { AesEcbService } from "crypto/aes-ecb.service";
import { EmailService } from "email/email.service";
import { error } from "console";

@Controller("user")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly _user: UserService,
    private readonly _perm: PortalUserPermissionService,
    private readonly _email: EmailService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("/stats")
  async getUserStats() {
    return await this._user.getUserStats();
  }

  @Post("serverside_list")
  serverSideList(@Body() body: any, @Query() query: any) {
    return this._user.serverSideList({
      page: Number(query.page ?? 0),
      size: Number(query.size ?? 10),
      sort: query.sort ?? "",
      search: query.search ?? "",
    });
  }

  @Post("/create")
  async createUser(@Body() data: any, @Req() req) {
    return await this._user.createUser({ ...data, admin_id: req.user.id_user });
  }

  @Post("/reset-password")
  async resetPasswordByAdmin(
    @Body() body: { id_user: number },
    @Req() req: any,
  ) {
    try {
      const result = await this._user.resetPasswordByAdmin(
        body.id_user,
        req.user.id_user,
      );

      const resetLink = `http://localhost:3000/auth/reset-password?token=${result.resetToken}`;

      const htmlContent = this._email.renderTemplate(
        "reset_password_admin.ejs",
        {
          fullName: result.fullName,
          resetLink: resetLink,
        },
      );

      await this._email.sendSimpleEmail(
        result.email,
        "ARMC Portal - Reset Password Request",
        htmlContent,
      );

      return {
        success: true,
        message: `Reset link for ${result.fullName} has been sent to their email.`,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || "Failed to reset password",
      );
    }
  }

  @Get("/extra-permissions/:id")
  async getUserExtraPermissions(@Param("id") id: string) {
    try {
      const rawDecrypted = this.aesEcbService.decryptBase64Url(id);
      const decryptedId = Number(rawDecrypted);

      if (isNaN(decryptedId) || rawDecrypted === "") {
        throw new Error();
      }
      const user = await this._user.findOneById(decryptedId);
      if (!user) throw new NotFoundException("User not found");
      return await this._perm.getUserExtraPermissions(
        decryptedId,
        user.id_role,
      );
    } catch (err) {
      if (err instanceof Error) console.log("Detail Error:", err.message);
      throw new BadRequestException("Invalid User ID or Data");
    }
  }

  @Put("/extra-permissions/:id")
  async updateUserExtraPermissions(
    @Param("id") id: string,
    @Body() body: { permission_keys: number[] },
    @Req() req,
  ) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._perm.syncUserPermissions(
        decryptedId,
        body.permission_keys,
        req.user.id_user,
      );
    } catch (error) {
      console.error("SERVICE ERROR:", error.message);
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Get("/:id")
  async getOne(@Param("id") id: string) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._user.findOneById(decryptedId);
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }

  @Put("/update/:id")
  async updateUser(@Param("id") id: string, @Body() data: any, @Req() req) {
    let decryptedId: number;

    try {
      decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error("Decryption failed");
    } catch {
      throw new BadRequestException("Invalid Encrypted ID Parameter");
    }

    try {
      return await this._user.updateUser(decryptedId, {
        ...data,
        admin_id: req.user.id_user,
      });
    } catch (error) {
      throw error;
    }
  }

  @Delete("/:id")
  async deleteUser(@Param("id") id: string, @Req() req) {
    try {
      const decryptedId = Number(this.aesEcbService.decryptBase64Url(id));
      if (isNaN(decryptedId)) throw new Error();
      return await this._user.deleteUser(decryptedId, req.user.id_user);
    } catch {
      throw new BadRequestException("Invalid User ID");
    }
  }
}
