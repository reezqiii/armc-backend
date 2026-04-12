import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { RolePermissionService } from "./role_has_permission.service";

@Controller("role-permission")
export class RolePermissionController {
  constructor(private readonly _service: RolePermissionService) {}

  @Get("permissions")
  getAllPermissions() {
    return this._service.getAllPermissions();
  }

  @Get(":id_role")
  getByRole(@Param("id_role") id_role: string) {
    return this._service.getPermissionsByRole(+id_role);
  }

  @Post(":id_role/sync")
  syncPermissions(
    @Param("id_role") id_role: string,
    @Body() body: { permission_ids: number[] },
  ) {
    return this._service.syncPermissions(+id_role, body.permission_ids);
  }
}
