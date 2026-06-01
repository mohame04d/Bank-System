import { Controller, Put, Get, Body, UseGuards, Req, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; phoneNumber?: string; avatar?: string }) {
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

  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    // Prevent admin from deleting themselves
    if (req.user.userId === id || req.user.id === id) {
      throw new UnauthorizedException('You cannot delete your own account');
    }
    return this.usersService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/:id/role')
  async updateUserRole(@Req() req: any, @Param('id') id: string, @Body('role') role: 'ADMIN' | 'CUSTOMER') {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    if (req.user.userId === id || req.user.id === id) {
      throw new UnauthorizedException('You cannot change your own role');
    }
    return this.usersService.updateUserRole(id, role);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/:id/status')
  async updateUserStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: 'ACTIVE' | 'FROZEN') {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    if (req.user.userId === id || req.user.id === id) {
      throw new UnauthorizedException('You cannot change your own status');
    }
    return this.usersService.updateUserStatus(id, status);
  }
}
