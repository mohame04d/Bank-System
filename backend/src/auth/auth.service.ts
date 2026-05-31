import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { randomInt, timingSafeEqual } from 'crypto';

import {
  SignInDto,
  SignUpDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth-dto';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../emails/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_CONSTANTS } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly mailService: EmailService,
    private prisma: PrismaService,
  ) { }

  // =========================
  // SIGN UP
  // =========================
  async signUp(signUpDto: SignUpDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signUpDto.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new HttpException('User already exists', 400);
    }

    const [hashedPassword, code] = await Promise.all([
      bcrypt.hash(signUpDto.password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS),
      Promise.resolve(randomInt(0, 1000000).toString().padStart(6, '0')),
    ]);

    const otpExpire = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRY_MS);

    const user = await this.prisma.user.create({
      data: {
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        email: signUpDto.email,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        verificationCode: code,
        otpPurpose: 'SIGN_UP',
        otpExpire,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    await this.mailService.sendSignupCode(user.email, code).catch((err) => {
      console.error('Failed to send signup code email:', err.message);
    });

    return {
      status: 'success',
      message: 'code send to email',
      data: user,
    };
  }

  async resendSignupCode(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        status: 'success',
        message: 'If this email exists, a verification code has been sent.',
      };
    }

    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    const otpExpire = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRY_MS);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        verificationCode: code,
        otpPurpose: 'SIGN_UP',
        otpExpire,
      },
    });

    await this.mailService.sendSignupCode(user.email, code).catch((err) => {
      console.error('Failed to resend signup code email:', err.message);
    });

    return {
      status: 'success',
      message: 'If this email exists, a verification code has been sent.',
    };
  }

  async verifyCodeSignUp(data: { email: string; code: string }) {
    if (!data.email || !data.code) {
      throw new HttpException('Email and code are required', 400);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        role: true,
        verificationCode: true,
        otpPurpose: true,
        otpExpire: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.otpPurpose !== 'SIGN_UP') {
      throw new UnauthorizedException('This code was not issued for sign-up verification');
    }

    if (!user.otpExpire || user.otpExpire < new Date()) {
      throw new UnauthorizedException('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== data.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    this.mailService.sendWelcomeEmail(user.email).catch((err) => {
      console.error('Non-critical email failed to send:', err.message);
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, countEx: AUTH_CONSTANTS.REFRESH_TOKEN_MAX_USES },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { email: data.email },
      data: {
        verificationCode: null,
        otpPurpose: null,
        otpExpire: null,
        refreshToken: hashedRefreshToken,
      },
    });

    return {
      status: 'success',
      message: 'Code verified successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // =========================
  // SIGN IN
  // =========================
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000;

  async signIn(signInDto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: signInDto.email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`);
    }

    const isPasswordValid = await bcrypt.compare(signInDto.password, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= AuthService.MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + AuthService.LOCKOUT_DURATION_MS);
        updateData.failedLoginAttempts = 0;

        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        throw new UnauthorizedException('Too many failed attempts. Account locked for 15 minutes.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, countEx: AUTH_CONSTANTS.REFRESH_TOKEN_MAX_USES },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const {
      passwordHash,
      failedLoginAttempts,
      lockedUntil,
      ...userWithoutPassword
    } = user;

    return {
      status: 'success',
      data: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // =========================
  // RESET PASSWORD (SEND CODE)
  // =========================
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        status: 'success',
        message: 'If this email exists, a verification code has been sent.',
      };
    }

    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    const otpExpire = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRY_MS);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        verificationCode: code,
        otpPurpose: 'RESET_PASSWORD',
        otpExpire,
      },
    });

    await this.mailService.resetPasswordCode(user.email, code).catch((err) => {
      console.error('Failed to send reset password code email:', err.message);
    });

    return {
      status: 'success',
      message: 'If this email exists, a verification code has been sent.',
      _dev_token: code, // keep for dev purposes without actual email sent
    };
  }

  // =========================
  // VERIFY CODE
  // =========================
  async verifyCode(data: { email: string; code: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        verificationCode: true,
        otpPurpose: true,
        otpExpire: true,
        email: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.otpPurpose !== 'RESET_PASSWORD') {
      throw new UnauthorizedException('This code was not issued for password reset');
    }

    if (!user.otpExpire || user.otpExpire < new Date()) {
      throw new UnauthorizedException('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== data.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const resetToken = require('crypto').randomUUID();
    const resetExpire = new Date(Date.now() + AUTH_CONSTANTS.RESET_TOKEN_EXPIRY_MS);

    await this.prisma.user.update({
      where: { email: data.email },
      data: {
        verificationCode: null,
        otpPurpose: null,
        otpExpire: null,
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpire,
      },
    });

    return {
      status: 'success',
      message: 'Code verified successfully',
      resetToken,
    };
  }

  // =========================
  // CHANGE PASSWORD (SECURED)
  // =========================
  async changePassword(dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        resetPasswordToken: true,
        resetPasswordExpires: true,
        email: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const tokenValid =
      user.resetPasswordToken !== null &&
      user.resetPasswordToken.length === dto.resetToken.length &&
      timingSafeEqual(Buffer.from(user.resetPasswordToken), Buffer.from(dto.resetToken));

    if (!tokenValid) {
      throw new UnauthorizedException('Invalid or missing reset token');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Reset token has expired. Please request a new code.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    this.mailService.sendPasswordChangeEmail(user.email).catch((err) => {
      console.error('Non-critical email failed to send:', err.message);
    });

    return {
      status: 'success',
      message: 'Password changed successfully',
    };
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  async refreshToken(incomingRefreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(incomingRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      if (!decoded || decoded.countEx <= 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          refreshToken: true,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      if (!user.refreshToken) {
        throw new UnauthorizedException('Session has been revoked. Please sign in again.');
      }

      const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);

      if (!isValid) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
        throw new UnauthorizedException('Token reuse detected — all sessions revoked');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      });

      const newRefreshToken = this.jwtService.sign(
        { ...payload, countEx: decoded.countEx - 1 },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
        },
      );

      const hashedNewRefresh = await bcrypt.hash(newRefreshToken, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedNewRefresh },
      });

      const { refreshToken: _, ...userData } = user;

      return {
        status: 'success',
        data: userData,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // =========================
  // LOGOUT
  // =========================
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }
}
