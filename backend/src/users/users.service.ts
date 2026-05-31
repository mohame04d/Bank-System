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

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, role: true }
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
}
