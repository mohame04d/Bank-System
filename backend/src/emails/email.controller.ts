import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // 1️⃣ Welcome Email
  @Post('welcome')
  async sendWelcomeEmail(@Body() body: { email: string }) {
    await this.emailService.sendWelcomeEmail(body.email);

    return {
      success: true,
      message: 'Welcome email sent successfully',
    };
  }

  // 2️⃣ Signup Verification Code
  @Post('signup-code')
  async sendSignupCode(@Body() body: { email: string; code: string }) {
    const result = await this.emailService.sendSignupCode(
      body.email,
      body.code,
    );

    return {
      success: true,
      message: 'Signup code email sent successfully',
      data: result,
    };
  }

  // 1️⃣ password is changed success
  @Post('password-success')
  async sendPasswordChangeEmail(@Body() body: { email: string }) {
    await this.emailService.sendPasswordChangeEmail(body.email);

    return {
      success: true,
      message: 'Password change email sent successfully',
    };
  }

  // 2️⃣ resetPassword Verification Code
  @Post('resetPassword-code')
  async resetPasswordCode(@Body() body: { email: string; code: string }) {
    const result = await this.emailService.sendSignupCode(
      body.email,
      body.code,
    );

    return {
      success: true,
      message: 'resetPassword code email sent successfully',
      data: result,
    };
  }
}
