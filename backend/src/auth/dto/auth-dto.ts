import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ChangePasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
