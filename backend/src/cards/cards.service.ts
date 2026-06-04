import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async getUserCards(userId: string) {
    return this.prisma.card.findMany({
      where: {
        account: {
          userId
        }
      },
      include: {
        account: {
          select: { accountNumber: true, currency: true }
        }
      }
    });
  }

  async createVirtualCard(userId: string, accountId: string) {
    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException('Account not found');

    const cardNumber = '4' + Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
    const cvv = Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join('');
    
    // expiry 3 years from now
    const now = new Date();
    const expiry = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${(now.getFullYear() + 3).toString().slice(-2)}`;

    return this.prisma.card.create({
      data: {
        cardNumber,
        cvv,
        expiry,
        accountId,
        dailyLimit: 5000,
        status: 'ACTIVE'
      }
    });
  }

  async toggleCardStatus(userId: string, cardId: string) {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, account: { userId } }
    });

    if (!card) throw new NotFoundException('Card not found');

    const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';

    return this.prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus }
    });
  }

  async setCardLimit(userId: string, cardId: string, limit: number) {
    if (limit <= 0) throw new BadRequestException('Limit must be positive');
    
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, account: { userId } }
    });

    if (!card) throw new NotFoundException('Card not found');

    return this.prisma.card.update({
      where: { id: cardId },
      data: { dailyLimit: limit }
    });
  }
}
