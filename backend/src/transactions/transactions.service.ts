import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async getHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        account: {
          userId: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { account: true }
    });
  }

  async transfer(userId: string, fromAccountId: string, toAccountNumber: string, amount: number, description?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Perform transfer in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Get sender account
      const fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId },
      });

      if (!fromAccount) throw new NotFoundException('Source account not found');
      if (fromAccount.status === 'CLOSED') throw new BadRequestException('Source account is closed');
      if (fromAccount.balance < amount) throw new BadRequestException('Insufficient funds');

      // 2. Get receiver account
      const toAccount = await prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
      });

      if (!toAccount) throw new NotFoundException('Destination account not found');
      if (toAccount.status === 'CLOSED') throw new BadRequestException('Destination account is closed');
      if (fromAccount.currency !== toAccount.currency) {
        throw new BadRequestException('Cannot transfer between accounts with different currencies');
      }

      // 3. Deduct from sender
      await prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      // 4. Add to receiver
      await prisma.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: amount } },
      });

      // 5. Create transaction records
      const withdrawal = await prisma.transaction.create({
        data: {
          amount: -amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          accountId: fromAccountId,
          referenceId: toAccountNumber,
          description: description || `Transfer to ${toAccountNumber}`,
        },
      });

      await prisma.transaction.create({
        data: {
          amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          accountId: toAccount.id,
          referenceId: fromAccount.accountNumber,
          description: `Transfer from ${fromAccount.accountNumber}`,
        },
      });

      return { withdrawal, toUserId: toAccount.userId, fromAccountNumber: fromAccount.accountNumber, currency: toAccount.currency };
    });

    this.notificationsService.createAndSend(
      result.toUserId,
      'Incoming Transfer',
      `You received ${result.currency} ${amount} from ${result.fromAccountNumber}`
    );

    return result.withdrawal;
  }

  async getAnalytics(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        amount: { lt: 0 } // Only expenses
      }
    });

    // Group by simple logic: Transfers vs Withdrawals (if categorized)
    // For this simple banking app, we'll group by type
    const grouped = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(grouped).map(name => ({
      name,
      value: grouped[name]
    }));
  }

  async exportHistory(userId: string) {
    const transactions = await this.getHistory(userId);
    let csv = 'ID,Date,Description,Type,Amount,Status\n';
    transactions.forEach(tx => {
      csv += `${tx.id},${tx.createdAt.toISOString()},"${tx.description || ''}",${tx.type},${tx.amount},${tx.status}\n`;
    });
    return csv;
  }

  async getAllSystemTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        account: {
          include: { user: { select: { email: true, firstName: true, lastName: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
