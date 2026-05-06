import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { RolePermissionService } from "./role_has_permission.service";
import { AesEcbService } from "crypto/aes-ecb.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";

@Controller("role-permission")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolePermissionController {
  constructor(
    private readonly _service: RolePermissionService,
    private readonly aesEcbService: AesEcbService,
  ) {}

  @Get("permissions")
  @RequirePermissions(101)
  getAllPermissions() {
    return this._service.getAllPermissions();
  }

  @Get(":id_role")
  @RequirePermissions(101)
  getByRole(@Param("id_role") id_role: string) {
    try {
      const decryptedId = this.aesEcbService.decryptBase64Url(id_role);
      const realId = Number(decryptedId);

      if (isNaN(realId)) throw new Error();

      return this._service.getPermissionsByRole(realId);
    } catch (error) {
      throw new BadRequestException("Invalid Encrypted Role ID");
    }
  }

  @Post(":id_role/sync")
  @RequirePermissions(101)
  syncPermissions(
    @Param("id_role") id_role: string,
    @Body() body: { permission_ids: number[] },
  ) {
    try {
      const decryptedId = this.aesEcbService.decryptBase64Url(id_role);
      const realId = Number(decryptedId);

      if (isNaN(realId)) throw new Error();

      return this._service.syncPermissions(realId, body.permission_ids);
    } catch (error) {
      throw new BadRequestException("Invalid Encrypted Role ID for Sync");
    }
  }
}
