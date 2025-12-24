import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from './prisma.service';

@Injectable()
export class MailService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async getTransporter() {
    const smtpSetting = await this.prisma.setting.findUnique({
      where: { key: 'smtp_settings' },
    });

    const smtpConfig = smtpSetting?.value as any || {};

    return nodemailer.createTransport({
      host: smtpConfig.host || this.configService.get('SMTP_HOST'),
      port: smtpConfig.port || this.configService.get('SMTP_PORT') || 587,
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.user || this.configService.get('SMTP_USER'),
        pass: smtpConfig.password || this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const smtpSetting = await this.prisma.setting.findUnique({
        where: { key: 'smtp_settings' },
      });
      const from = (smtpSetting?.value as any)?.from || this.configService.get('SMTP_FROM') || 'noreply@mindmap.app';

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `;

    return this.sendMail(email, 'Verify Your Email - MindMap', html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendMail(email, 'Reset Your Password - MindMap', html);
  }
}
