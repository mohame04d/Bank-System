import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountType } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  async getUserAccounts(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        savingsGoals: {
          where: { status: { notIn: ['CANCELLED', 'ARCHIVED'] } }
        }
      }
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
        savingsGoals: {
          where: { status: { notIn: ['CANCELLED', 'ARCHIVED'] } }
        }
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async createSubAccount(userId: string, type: AccountType, currency: string = 'USD'): Promise<Account> {
    return this.prisma.account.create({
      data: {
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        balance: 0,
        currency,
        type,
        userId,
      },
    });
  }

  async closeAccount(accountId: string, userId: string, transferToAccountId?: string): Promise<Account> {
    const accountToClose = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!accountToClose) throw new NotFoundException('Account not found');
    if (accountToClose.status === 'CLOSED') throw new BadRequestException('Account is already closed');

    if (accountToClose.balance > 0) {
      if (!transferToAccountId) {
        throw new BadRequestException('Must provide a destination account to transfer remaining balance');
      }

      const toAccount = await this.prisma.account.findFirst({
        where: { id: transferToAccountId, userId },
      });

      if (!toAccount) throw new NotFoundException('Destination account not found');
      if (toAccount.status === 'CLOSED') throw new BadRequestException('Destination account is closed');
      if (toAccount.id === accountToClose.id) throw new BadRequestException('Cannot transfer to the same account');

      await this.prisma.$transaction([
        this.prisma.account.update({
          where: { id: accountToClose.id },
          data: { balance: 0 },
        }),
        this.prisma.account.update({
          where: { id: toAccount.id },
          data: { balance: { increment: accountToClose.balance } },
        }),
        this.prisma.transaction.create({
          data: {
            amount: -accountToClose.balance,
            type: 'TRANSFER',
            status: 'COMPLETED',
            accountId: accountToClose.id,
            referenceId: toAccount.accountNumber,
            description: `Account closure transfer to ${toAccount.accountNumber}`,
          },
        }),
        this.prisma.transaction.create({
          data: {
            amount: accountToClose.balance,
            type: 'TRANSFER',
            status: 'COMPLETED',
            accountId: toAccount.id,
            referenceId: accountToClose.accountNumber,
            description: `Transfer from closed account ${accountToClose.accountNumber}`,
          },
        }),
      ]);
    }

    return this.prisma.account.update({
      where: { id: accountToClose.id },
      data: { status: 'CLOSED' },
    });
  }
}
