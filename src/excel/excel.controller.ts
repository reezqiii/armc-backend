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

@Controller("excel")
export class ExcelController {
  constructor(private readonly requestService: RequestService) {}

  @Get("export-list")
  async exportCompleted(
    @Query("search") search: string,
    @Query("sort_by") sort_by: string,
    @Query("sort_order") sort_order: string,
    @Query("status") status: string,

    @Query("full_name") full_name: string,
    @Query("badge_no") badge_no: string,
    @Query("email") email: string,
    @Query("department_name") department_name: string,
    @Query("project_name") project_name: string,
    @Query("position_name") position_name: string,
    @Query("keyword") keyword: string,
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

      if (full_name) filters.full_name = full_name;
      if (badge_no) filters.badge_no = badge_no;
      if (email) filters.email = email;
      if (department_name) filters.department_name = department_name;
      if (project_name) filters.project_name = project_name;
      if (position_name) filters.position_name = position_name;
      if (keyword) filters.keyword = keyword;

      const statusMapping: Record<string, number> = {
        draft: 0,
        "awaiting-hod-approval": 1,
        "rejected-hod-approval": 2,
        "awaiting-it-manager-approval": 3,
        "rejected-it-manager-approval": 4,
        completed: 5,
        returned: 6,
        canceled: 7,
      };

      if (status && statusMapping[status.toLowerCase()] !== undefined) {
        filters["request_status"] = statusMapping[status.toLowerCase()];
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
