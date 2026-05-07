import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import * as ejs from "ejs";
import * as fs from "fs";
import * as nodemailer from "nodemailer";
import { Repository } from "typeorm";
import { Email } from "./entities/email.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EmailService {
  private JWT_SECRET: string;
  private gmailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Email)
    private readonly _portalEmail: Repository<Email>,
  ) {
    this.JWT_SECRET = this.configService.get<string>("JWT_SECRET");

    this.gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.configService.get<string>("GMAIL_USER"),
        pass: this.configService.get<string>("GMAIL_PASS"),
      },
    });
  }

  async getPortalEmailList(where?: Record<string, any>) {
    const qb = this._portalEmail.createQueryBuilder("email");
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        qb.andWhere(`email.${key} = :${key}`, { [key]: value });
      });
    }
    return await qb.getMany();
  }

  async sendSimpleEmail(to: string | string[], subject: string, html: string) {
    try {
      await this.gmailTransporter.sendMail({
        from: `"ARMC Portal" <${this.configService.get("GMAIL_USER")}>`,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Nodemailer Error:", error.message);
      throw error;
    }
  }

  renderTemplate(filename: string, data: any) {
    let viewsPath = path.join(process.cwd(), "src", "email", "views");

    if (!fs.existsSync(viewsPath)) {
      viewsPath = path.join(process.cwd(), "dist", "email", "views");
    }

    const filePath = path.join(viewsPath, filename);

    if (!fs.existsSync(filePath)) {
      console.error(`Template not found at: ${filePath}`);
      return `Template error: ${filename} not found`;
    }

    const template = fs.readFileSync(filePath, "utf8");
    return ejs.render(template, data);
  }
}
