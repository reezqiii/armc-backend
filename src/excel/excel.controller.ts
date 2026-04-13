import {
  Controller,
  Get,
  Res,
  Query,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { buildCompletedExcelTemplate } from "./views/export_template";
import { RequestService } from "portal_request_user_permission/request.service";
import { JwtAuthGuard } from "jwt-auth.guard";
import { PermissionGuard, RequirePermissions } from "permission.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("excel")
@ApiBearerAuth("access-token")
export class ExcelController {
  constructor(private readonly requestService: RequestService) {}

  @Get("export-list")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions("request.export")
  async exportCompleted(
    @Query("search") search: string,
    @Query("sort_by") sort_by: string,
    @Query("sort_order") sort_order: string,
    @Query("status") status: string,
    @Res() res: Response,
  ) {
    try {
      let filters: Record<string, any> = {};

      if (search) {
        try {
          filters = JSON.parse(search);
        } catch {
          filters = { keyword: search };
        }
      }

      const statusMapping: Record<string, number> = {
        canceled: 0,
        "pending-dept-head-approval": 1,
        "rejected-by-dept-head-approval": 2,
        "pending-it-head-approval": 3,
        "rejected-by-it-head-approval": 4,
        completed: 5,
      };

      if (status) {
        const normalizedStatus = status.toLowerCase().replace(/ /g, "-");

        if (statusMapping[normalizedStatus] !== undefined) {
          filters["request_status"] = statusMapping[normalizedStatus];
        } else if (!isNaN(Number(status))) {
          filters["request_status"] = Number(status);
        }
      }

      const requests = await this.requestService.exportList(
        filters,
        sort_by,
        sort_order,
      );

      const label = status ? status.toUpperCase().replace(/-/g, "_") : "ALL";
      const buffer = await buildCompletedExcelTemplate(requests);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Export_Requests_${label}.xlsx`,
      );

      return res.status(HttpStatus.OK).send(buffer);
    } catch (err) {
      console.error("ERROR EXPORT CONTROLLER:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Export Excel failed",
        error: err.message,
      });
    }
  }
}
