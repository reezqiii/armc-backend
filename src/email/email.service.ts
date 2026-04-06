import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { sendEmailDto } from "./dto/send-email.dto";
import * as path from "path";
import * as ejs from "ejs";
import * as fs from "fs";
import * as nodemailer from "nodemailer";
import { Repository } from "typeorm";
import { Email } from "./entities/email.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EmailService {
  private EMAIL_API_URL: string;
  private JWT_SECRET: string;
  private JWT_EMAIL_TOKEN: string;
  private gmailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,

    @InjectRepository(Email)
    private readonly _portalEmail: Repository<Email>,
  ) {
    this.EMAIL_API_URL = this.configService.get<string>("EMAIL_API");
    this.JWT_SECRET = this.configService.get<string>("JWT_SECRET");
    this.JWT_EMAIL_TOKEN = this.configService.get<string>("JWT_TOKEN_EMAIL");

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

  private generateJwtToken(secret: string): string {
    return jwt.sign({ app: secret }, this.JWT_SECRET, { expiresIn: "1h" });
  }

  async sendSimpleEmail(to: string, subject: string, html: string) {
    try {
      await this.gmailTransporter.sendMail({
        from: `"ARMC Portal" <${this.configService.get("GMAIL_USER")}>`,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error("Gmail Error:", error.message);
      throw error;
    }
  }

  async sendEmail(data: sendEmailDto) {
    try {
      const jwtToken = this.generateJwtToken("ARMC EMAIL");
      const payload: any = {
        htmlContent: data.content,
        subject: data.subject,
        JWT_TOKEN: this.JWT_EMAIL_TOKEN,
        attachment_list: [],
        email_to: data.email_to,
      };
      if (data.email_cc) payload.email_cc = data.email_cc;
      if (data.email_bcc) payload.email_bcc = data.email_bcc;

      await axios.post(this.EMAIL_API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      return { success: true };
    } catch (error) {
      console.error("Email API Error:", error.message);
    }
  }

 renderTemplate(filename: string, data: any) {
  let filePath = path.join(__dirname, "views", filename);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "..", "email", "views", filename);
  }

  const logoPath = path.join(process.cwd(), "public", "img", "armc.png");
  let logoBase64 = "";
  
  try {
    if (fs.existsSync(logoPath)) {
      logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
    }
  } catch (e) {
    console.log("Logo skip");
  }

  const renderData = { ...data, logoBase64 };

  if (!fs.existsSync(filePath)) {
    console.error("❌ TEMPLATE TETAP TIDAK KETEMU DI:", filePath);
    return `Template error: ${filename} not found`;
  }

  const template = fs.readFileSync(filePath, "utf8");
  return ejs.render(template, renderData);
}
}
