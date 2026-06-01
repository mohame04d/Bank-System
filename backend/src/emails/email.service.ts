import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getWelcomeEmailHtml } from './templates/welcome-email.template';
import { getVerificationEmailHtml } from './templates/verification-email';
import { getPasswordResetConfirmationEmailHtml } from './templates/reset-password-email';
import { getResetPasswordHtml } from './templates/verification-resetpassword';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  private readonly defaultFrom = 'Bank <onboarding@resend.dev>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('Resend API key is required');
    }

    this.resend = new Resend(apiKey);
  }

  // =========================
  // ✅ Welcome Email
  // =========================
  async sendWelcomeEmail(userEmail: string) {
    try {
      const htmlContent = getWelcomeEmailHtml(userEmail);

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom, // ✅ التعديل هنا
        to: userEmail,
        subject: 'Welcome to NeuroMeet!',
        html: htmlContent,
      });

      if (error) throw error;

      this.logger.log(`✅ Welcome email sent to ${userEmail}`);
      return data;
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email`, error);
      throw new Error('Could not send welcome email');
    }
  }

  // =========================
  // ✅ Signup Code Email
  // =========================
  async sendSignupCode(email: string, code: string) {
    try {
      if (!email || !code) {
        throw new Error('Email and code are required');
      }

      const htmlContent = getVerificationEmailHtml(code);

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom, // ✅ التعديل هنا
        to: email,
        subject: 'Your Verification Code',
        html: htmlContent,
      });

      if (error) throw error;

      this.logger.log(`✅ Signup code sent to ${email}`);
      return data;
    } catch (error) {
      this.logger.error(`❌ Failed to send signup code`, error);
      throw new Error('Could not send signup code email');
    }
  }

  // =========================
  // ✅ Password Change Email
  // =========================
  async sendPasswordChangeEmail(email: string) {
    try {
      const htmlContent = getPasswordResetConfirmationEmailHtml(email);

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom, // ✅ التعديل هنا
        to: email,
        subject: 'Password Change Confirmation',
        html: htmlContent,
      });

      if (error) throw error;

      this.logger.log(`✅ Password change email sent to ${email}`);
      return data;
    } catch (error) {
      this.logger.error(`❌ Failed to send password change email`, error);
      throw new Error('Could not send password change email');
    }
  }

  // =========================
  // ✅ Reset Password Code
  // =========================
  async resetPasswordCode(email: string, code: string) {
    try {
      if (!email || !code) {
        throw new Error('Email and code are required');
      }

      const htmlContent = getResetPasswordHtml(code);

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom, // ✅ التعديل هنا
        to: email,
        subject: 'Your Verification Code',
        html: htmlContent,
      });

      if (error) throw error;

      this.logger.log(`✅ Reset password code sent to ${email}`);
      return data;
    } catch (error) {
      this.logger.error(`❌ Failed to send reset password code`, error);
      throw new Error('Could not send reset password code email');
    }
  }
}