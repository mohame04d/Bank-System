import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { randomInt, timingSafeEqual } from 'crypto';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

// Increase the verification window to allow for clock drift (up to 5 minutes)
authenticator.options = { window: 10 };

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
    const initialAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

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
        accounts: {
          create: {
            accountNumber: initialAccountNumber,
            balance: 1000.0,
            currency: 'EGP',
            type: 'CHECKING',
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // Skip email sending for sign up in demo/free mode as requested by user
    return this.generateAuthResponse(user);
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
      sub: user.id,
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
        avatar: true,
        status: true,
        isTwoFactorEnabled: true,
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

    if (user.status === 'FROZEN') {
      throw new UnauthorizedException('Your account has been frozen by an administrator. Please contact support.');
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

    if (user.isTwoFactorEnabled) {
      const payload = { sub: user.id, email: user.email, isTwoFactorPending: true };
      const tempToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '5m',
      });
      return {
        status: 'success',
        requiresTwoFactor: true,
        tempToken,
      };
    }

    return this.generateAuthResponse(user);
  }

  private async generateAuthResponse(user: any) {
    const payload = {
      sub: user.id,
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
  // TWO FACTOR AUTH (2FA)
  // =========================
  async generateTwoFactorSecret(userId: string, email: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'BankSystem', secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeDataUrl };
  }

  async turnOnTwoFactorAuthentication(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA secret not generated');
    }

    const cleanCode = code.toString().replace(/\s/g, '');
    console.log('--- 2FA TURN ON DEBUG ---');
    console.log('Incoming Code:', code);
    console.log('Clean Code:', cleanCode);
    console.log('Secret:', user.twoFactorSecret);
    const isCodeValid = authenticator.verify({ token: cleanCode, secret: user.twoFactorSecret });
    console.log('Is Valid:', isCodeValid);
    if (!isCodeValid) throw new BadRequestException('Invalid authentication code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { status: 'success', message: '2FA enabled successfully' };
  }

  async turnOffTwoFactorAuthentication(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return { status: 'success', message: '2FA is already disabled' };
    }

    const isCodeValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isCodeValid) throw new BadRequestException('Invalid authentication code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });

    return { status: 'success', message: '2FA disabled successfully' };
  }

  async verifyTwoFactorLogin(tempToken: string, code: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(tempToken, { secret: process.env.JWT_SECRET });
      if (!decoded.isTwoFactorPending) throw new UnauthorizedException('Invalid temp token');

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true, email: true, role: true, firstName: true, lastName: true, avatar: true, status: true, twoFactorSecret: true, isTwoFactorEnabled: true
        }
      });

      if (!user || user.status === 'FROZEN') throw new UnauthorizedException('Account disabled');
      if (!user.isTwoFactorEnabled || !user.twoFactorSecret) throw new UnauthorizedException('2FA is not enabled');

      const cleanCode = code.toString().replace(/\s/g, '');
    console.log('--- 2FA DEBUG ---');
    console.log('Incoming Code:', code);
    console.log('Clean Code:', cleanCode);
    console.log('Secret Length:', user.twoFactorSecret?.length);
    const isCodeValid = authenticator.verify({ token: cleanCode, secret: user.twoFactorSecret });
    console.log('Is Valid:', isCodeValid);
      if (!isCodeValid) throw new BadRequestException('Invalid authentication code');

      return this.generateAuthResponse(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token/code');
    }
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
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          refreshToken: true,
          avatar: true,
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
        sub: user.id,
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
