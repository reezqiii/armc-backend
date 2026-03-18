// role_permission/role_permission.controller.ts
import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { RolePermissionService } from "./role_has_permission.service";

@Controller("role-permission")
export class RolePermissionController {
  constructor(private readonly _service: RolePermissionService) {}

  // GET /role-permission/permissions → semua permission
  @Get("permissions")
  getAllPermissions() {
    return this._service.getAllPermissions();
  }

  // GET /role-permission/:id_role → permission milik role + status assigned
  @Get(":id_role")
  getByRole(@Param("id_role") id_role: string) {
    return this._service.getPermissionsByRole(+id_role);
  }

  // POST /role-permission/:id_role/sync → assign permission ke role
  @Post(":id_role/sync")
  syncPermissions(
    @Param("id_role") id_role: string,
    @Body() body: { permission_ids: number[] },
  ) {
    return this._service.syncPermissions(+id_role, body.permission_ids);
  }
}