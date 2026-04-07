import { Controller, Post, Body } from "@nestjs/common";
import { EmailService } from "./email.service";
import { sendEmailDto } from "./dto/send-email.dto";

@Controller("api/email")
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post("/test")
  async sendEmail(@Body() data: sendEmailDto) {
    const view_data = {
      approverName: "John Doe",
      requestNumber: "ITF14-2024-0001",
      requestorName: "Jane Smith",
      requestDate: "2024-06-15",
      requestDescription: "Access to the new financial system",
      approvalLink: "https://example.com/approve?req=REQ-2024-0001",
    };

    const content = this.emailService.renderTemplate("approval.ejs", view_data);

    const result = await this.emailService.sendSimpleEmail(
      data.email_to.join(","),
      data.subject || "Approval Request - ARMC Portal",
      content,
    );

    return result;
  }
}
