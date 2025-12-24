import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RecaptchaService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async verify(token: string): Promise<boolean> {
    const recaptchaSetting = await this.prisma.setting.findUnique({
      where: { key: 'recaptcha_enabled' },
    });

    const isEnabled = (recaptchaSetting?.value as any)?.enabled;
    if (!isEnabled) {
      return true;
    }

    const secretKey = this.configService.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      return true;
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${token}`,
      });

      const data = await response.json();

      if (!data.success) {
        throw new BadRequestException('reCAPTCHA verification failed');
      }

      return true;
    } catch (error) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }
  }
}
