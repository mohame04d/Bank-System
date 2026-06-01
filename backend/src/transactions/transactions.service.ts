import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        account: {
          userId: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async transfer(userId: string, fromAccountId: string, toAccountNumber: string, amount: number, description?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Perform transfer in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // 1. Get sender account
      const fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId },
      });

      if (!fromAccount) throw new NotFoundException('Source account not found');
      if (fromAccount.balance < amount) throw new BadRequestException('Insufficient funds');

      // 2. Get receiver account
      const toAccount = await prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
      });

      if (!toAccount) throw new NotFoundException('Destination account not found');

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

      return withdrawal;
    });
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
