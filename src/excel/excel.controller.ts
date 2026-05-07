import {
  Controller,
  Get,
  Res,
  Query,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { RequestService } from "portal_request_user_permission/request.service";
import { UserService } from "portal_user_db/user.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";
import { buildUserListExcel } from "./views/export_template";

@Controller("excel")
export class ExcelController {
  constructor(
    private readonly requestService: RequestService,
    private readonly userService: UserService,
  ) {}

  @Get("export-list")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.export")
  async exportCompleted(
    @Query("search") search: string,
    @Query("sort_by") sort_by: string,
    @Query("sort_order") sort_order: string,
    @Res() res: Response,
  ) {}

  @Get("export-users")
  @UseGuards(JwtAuthGuard)
  async exportUsers(@Query("search") search: string, @Res() res: Response) {
    try {
      let filters = {};
      if (search) {
        try {
          filters = JSON.parse(search);
        } catch {
          filters = {};
        }
      }

      const users = await this.userService.findAllForExport(filters);

      const buffer = await buildUserListExcel(users);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=ARMC_User_List_${new Date().getTime()}.xlsx`,
      );

      return res.status(HttpStatus.OK).send(buffer);
    } catch (err) {
      console.error("ERROR EXPORT USER:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Export User Excel failed",
        error: err.message,
      });
    }
  }
}
