import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import * as fs from "fs";
import { Response } from "express";
import { Query } from "@nestjs/common";
import { SftpService } from "./sftp.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import { InjectRepository } from "@nestjs/typeorm";
import { PortalSftp } from "./sftp.entity";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "jwt-auth.guard";
import { AesEcbService } from "crypto/aes-ecb.service";

@Controller("sftp")
export class SftpController {
  constructor(
    private readonly sftpService: SftpService,
    @InjectRepository(PortalSftp)
    private readonly repo: Repository<PortalSftp>,
    private readonly aesEcb: AesEcbService,
  ) {}
  private generateTimestamp(): string {
    const now = new Date();

    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
  }

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), "uploads");
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + path.extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const isPdfMime = file.mimetype === "application/pdf";
        const isPdfExt =
          path.extname(file.originalname).toLowerCase() === ".pdf";

        if (!isPdfMime || !isPdfExt) {
          return cb(
            new BadRequestException("Only PDF files are allowed"),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file, @Body() body, @Req() req) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const fileBuffer = fs.readFileSync(file.path);
    const fileHeader = fileBuffer.toString("utf8", 0, 4);

    if (!fileHeader.startsWith("%PDF")) {
      fs.unlinkSync(file.path); // delete invalid file
      throw new BadRequestException("Invalid PDF file");
    }

    const { id_request, remarks } = body;

    const idReq = Number(this.aesEcb.decryptBase64Url(String(id_request)));
    if (isNaN(idReq)) throw new BadRequestException("Invalid request ID");

    const localPath = file.path;

    const timestamp = this.generateTimestamp();
    const userId = req.user.id_user;
    const remoteName = `pcms-access-${timestamp}-${userId}.pdf`;

    const remotePath = `/PCMS/armc/${remoteName}`;

    await this.sftpService.uploadFile(localPath, remotePath);

    const attachment = this.repo.create({
      id_user: req.user.id_user,
      id_request: idReq,
      name_file: remoteName,
      upload_date: new Date(),
      remarks,
      status_active: 0,
    });

    await this.repo.save(attachment);

    return { success: true, data: attachment };
  }

  @Get("list/:id_request")
  @UseGuards(JwtAuthGuard)
  async list(@Param("id_request") encryptedId: string) {
    const id = Number(this.aesEcb.decryptBase64Url(encryptedId));

    if (isNaN(id)) {
      throw new BadRequestException("Invalid request ID");
    }

    const data = await this.repo.find({
      where: { id_request: id, status_active: 0 },
      relations: ["user"],
      order: { upload_date: "DESC" },
    });

    return {
      data: data.map((item) => ({
        id: item.id,
        file_name: item.name_file,
        uploaded_by: item.user?.full_name || "-",
        created_at: item.upload_date,
        remarks: item.remarks,
      })),
    };
  }

  @Get("download/:id")
  @UseGuards(JwtAuthGuard)
  async download(@Param("id") id: number, @Res() res: Response) {
    const file = await this.repo.findOne({ where: { id: Number(id) } });

    if (!file) {
      throw new BadRequestException("File not found");
    }

    const remotePath = `/PCMS/armc/${file.name_file}`;

    const exists = await this.sftpService.exists(remotePath);
    if (!exists) {
      console.log("NOT FOUND ON SFTP:", remotePath);
      throw new BadRequestException("File not found on SFTP");
    }

    try {
      const fileBuffer = await this.sftpService.downloadFile(remotePath);

      res.set({
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name_file}"`,
        "Content-Length": fileBuffer.length,
      });

      res.end(fileBuffer);
    } catch (err) {
      console.error("SFTP DOWNLOAD ERROR:", err.message);
      throw new BadRequestException("File could not be downloaded from SFTP");
    }
  }

  @Get("serverside_list")
  @UseGuards(JwtAuthGuard)
  async serversideList(
    @Query("search") searchStr = "{}",
    @Query("sort_by") sortBy = "upload_date",
    @Query("sort_order") sortOrder = "DESC",
    @Query("page") pageStr = "0",
    @Query("size") sizeStr = "10",
  ) {
    let search: any = {};
    try {
      search = JSON.parse(searchStr || "{}");
    } catch {
      throw new BadRequestException("Invalid search JSON");
    }

    // wajib ada id_request (encrypted)
    if (!search.id_request) {
      throw new BadRequestException("id_request is required in search");
    }

    const idReq = Number(
      this.aesEcb.decryptBase64Url(String(search.id_request)),
    );
    if (isNaN(idReq)) throw new BadRequestException("Invalid request ID");

    const page = Math.max(0, Number(pageStr) || 0);
    const size = Math.max(1, Number(sizeStr) || 10);

    const order = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

    // whitelist sort_by biar aman
    const sortMap: Record<string, string> = {
      file_name: "sftp.name_file",
      uploaded_by: "user.full_name",
      created_at: "sftp.upload_date",
      remarks: "sftp.remarks",
      upload_date: "sftp.upload_date",
    };
    const sortCol = sortMap[sortBy] || "sftp.upload_date";

    const qb = this.repo
      .createQueryBuilder("sftp")
      .leftJoinAndSelect("sftp.user", "user")
      .where("sftp.id_request = :idReq", { idReq })
      .andWhere("sftp.status_active = 0");

    // filters (sesuaikan dengan id kolom filter di FE)
    if (search.file_name) {
      qb.andWhere("LOWER(sftp.name_file) LIKE LOWER(:file)", {
        file: `%${search.file_name}%`,
      });
    }
    if (search.uploaded_by) {
      qb.andWhere("LOWER(user.full_name) LIKE LOWER(:uploader)", {
        uploader: `%${search.uploaded_by}%`,
      });
    }
    if (search.remarks) {
      qb.andWhere("LOWER(sftp.remarks) LIKE LOWER(:remarks)", {
        remarks: `%${search.remarks}%`,
      });
    }

    const totalRows = await qb.getCount();

    const rows = await qb
      .orderBy(sortCol, order as any)
      .skip(page * size)
      .take(size)
      .getMany();

    const totalPages = Math.max(1, Math.ceil(totalRows / size));

    return {
      data: rows.map((item) => ({
        id: item.id,
        file_name: item.name_file,
        uploaded_by: item.user?.full_name || "-",
        created_at: item.upload_date,
        remarks: item.remarks,
      })),
      total_pages: totalPages,
      total_rows: totalRows,
    };
  }

  @Delete("delete/:id")
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: number) {
    const file = await this.repo.findOne({
      where: {
        id: Number(id),
        status_active: 0, // hanya bisa delete yang active
      },
    });

    if (!file) {
      throw new BadRequestException("File not found or already inactive");
    }

    await this.repo.update(id, {
      status_active: 1,
    });

    return { success: true };
  }
}
