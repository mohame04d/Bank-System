import { Controller, Put, Get, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  async getAllUsers(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.usersService.getAllUsers();
  }
}
