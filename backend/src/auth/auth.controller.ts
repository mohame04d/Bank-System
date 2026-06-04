import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { JwtAuthGuard as AuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyCodeDto,
} from './dto/auth-dto';

// SECURITY: ThrottlerGuard enforces rate limiting on all endpoints in this controller.
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('/resend-signup-code')
  resendSignupCode(@Body() dto: ResetPasswordDto) {
    return this.authService.resendSignupCode(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/signup-code')
  verifyCodeSignUp(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCodeSignUp(verifyCodeDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/sign-in/2fa')
  verifyTwoFactorLogin(@Body('tempToken') tempToken: string, @Body('code') code: string) {
    return this.authService.verifyTwoFactorLogin(tempToken, code);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('/reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/verify-code')
  verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('/change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('/refresh-token')
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('/logout')
  @Roles('CUSTOMER', 'ADMIN')
  @UseGuards(AuthGuard)
  logout(@Req() req: any) {
    return this.authService.logout(req.user.userId || req.user.id);
  }

  // 2FA Endpoints
  @Post('/2fa/generate')
  @UseGuards(AuthGuard)
  generateTwoFactorSecret(@Req() req: any) {
    return this.authService.generateTwoFactorSecret(req.user.userId, req.user.email);
  }

  @Post('/2fa/turn-on')
  @UseGuards(AuthGuard)
  turnOnTwoFactorAuthentication(@Req() req: any, @Body('code') code: string) {
    return this.authService.turnOnTwoFactorAuthentication(req.user.userId, code);
  }

  @Post('/2fa/turn-off')
  @UseGuards(AuthGuard)
  turnOffTwoFactorAuthentication(@Req() req: any, @Body('code') code: string) {
    return this.authService.turnOffTwoFactorAuthentication(req.user.userId, code);
  }
}
