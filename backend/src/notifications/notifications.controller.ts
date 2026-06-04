import { Controller, Get, Put, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }
}
