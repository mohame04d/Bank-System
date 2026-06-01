import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateStripeId(userId: string, stripeId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { stripeId },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phoneNumber?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, role: true, avatar: true }
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        accounts: {
          select: {
            balance: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  async updateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER') {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'FROZEN') {
    // If frozen, we also revoke all active sessions by nullifying refreshToken
    const data: any = { status };
    if (status === 'FROZEN') {
      data.refreshToken = null;
    }
    
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, status: true }
    });
  }
}
