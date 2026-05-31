import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountType } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getUserAccounts(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async getAccountDetails(accountId: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async createSubAccount(userId: string, type: AccountType): Promise<Account> {
    return this.prisma.account.create({
      data: {
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        balance: 0,
        type,
        userId,
      },
    });
  }
}
