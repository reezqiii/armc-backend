import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { sendEmailDto } from "./dto/send-email.dto";
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { Repository } from "typeorm";
import { Email } from "./entities/email.entity";
import { InjectRepository } from "@nestjs/typeorm";


@Injectable()
export class EmailService {
  private EMAIL_API_URL: string;
  private JWT_SECRET: string;
  private JWT_EMAIL_TOKEN: string;

  constructor(
    private configService: ConfigService,

    @InjectRepository(Email)
    private readonly _portalEmail: Repository<Email>,

  ) {
    this.EMAIL_API_URL = this.configService.get<string>("EMAIL_API");
    this.JWT_SECRET = this.configService.get<string>("JWT_SECRET");
    this.JWT_EMAIL_TOKEN = this.configService.get<string>("JWT_TOKEN_EMAIL");
  }

  // Mendapatkan list email dari portal
  async getPortalEmailList(where?: Record<string, any>) {
    const qb = this._portalEmail.createQueryBuilder('email');

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

  // Email Helper
  async sendEmail(data: sendEmailDto) {
    try {
      const jwtToken = this.generateJwtToken("SEATRIUM EMAIL");
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
    const filePath = path.join(process.cwd(), "src", "email", "views", filename);
    const template = fs.readFileSync(filePath, "utf8");
    return ejs.render(template, data);
  }

}

