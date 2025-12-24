import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { MailService } from '../common/mail.service';
import { LoggerService } from '../common/logger.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private mailService: MailService,
    private logger: LoggerService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        verifyToken,
      },
    });

    await this.logger.log({
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    // Check if email verification is required
    const generalSettings = await this.prisma.setting.findUnique({
      where: { key: 'general_settings' },
    });
    const requireVerification = (generalSettings?.value as any)?.requireEmailVerification;

    if (requireVerification) {
      await this.mailService.sendVerificationEmail(user.email, verifyToken);
      return { message: 'Registration successful. Please verify your email.' };
    }

    // Auto-verify if not required
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const generalSettings = await this.prisma.setting.findUnique({
      where: { key: 'general_settings' },
    });
    const requireVerification = (generalSettings?.value as any)?.requireEmailVerification;

    if (requireVerification && !user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await this.logger.log({
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.logger.log({
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      userId,
    });

    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    });

    await this.logger.log({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
