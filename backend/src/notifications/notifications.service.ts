import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway
  ) {}

  async createAndSend(userId: string, title: string, message: string) {
    // Save to database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // Emit real-time socket event
    this.notificationsGateway.sendNotificationToUser(userId, 'transaction_created', notification);

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
