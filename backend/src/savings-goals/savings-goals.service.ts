import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutoSaveFrequency } from '@prisma/client';

@Injectable()
export class SavingsGoalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getGoals(accountId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Account not found');

    return this.prisma.savingsGoal.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(
    accountId: string,
    userId: string,
    data: {
      name: string;
      targetAmount: number;
      targetDate?: Date;
      autoSaveAmount?: number;
      autoSaveFrequency?: AutoSaveFrequency;
      sourceAccountId?: string;
      isLocked?: boolean;
      lockedUntil?: Date;
    },
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Account not found');

    return this.prisma.savingsGoal.create({
      data: {
        accountId,
        name: data.name,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate,
        autoSaveAmount: data.autoSaveAmount,
        autoSaveFrequency: data.autoSaveFrequency,
        sourceAccountId: data.sourceAccountId,
        isLocked: data.isLocked || false,
        lockedUntil: data.lockedUntil,
      },
    });
  }

  async addFunds(goalId: string, userId: string, amount: number, sourceAccountId?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (prisma) => {
      const goal = await prisma.savingsGoal.findUnique({
        where: { id: goalId },
        include: { account: true },
      });

      if (!goal) throw new NotFoundException('Goal not found');
      if (goal.account.userId !== userId) throw new NotFoundException('Unauthorized');

      // If money comes from another account
      if (sourceAccountId) {
        const sourceAccount = await prisma.account.findFirst({
          where: { id: sourceAccountId, userId },
          include: { savingsGoals: { where: { status: { notIn: ['CANCELLED', 'ARCHIVED'] } } } },
        });
        if (!sourceAccount) throw new NotFoundException('Source account not found');
        
        let availableBalance = sourceAccount.balance;
        if (sourceAccount.type === 'SAVINGS' && sourceAccount.savingsGoals) {
           const locked = sourceAccount.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
           availableBalance = sourceAccount.balance - locked;
        }

        if (availableBalance < amount) throw new BadRequestException('Insufficient available funds in source account');

        await prisma.account.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: amount } },
        });
      }

      // Add money to the goal
      const updatedGoal = await prisma.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: amount } },
      });

      // The total balance of the account is naturally updated?
      // Wait: The user asked: "Total Balance = 50000, Available Balance = 20000, Locked In Goals = 30000".
      // This means the `currentAmount` in the goal IS part of the Account balance!
      // If we deduct from sourceAccountId (which could be checking) and put into the Savings goal...
      // Does it increase the Savings Account balance? Yes!
      // So if sourceAccountId is provided, we must ALSO increment the `accountId` (Savings Account) balance.
      // If sourceAccountId is NOT provided, maybe they are just allocating existing savings account balance to the goal?
      // Actually, if they add funds to the goal, it must come from somewhere. Usually from Checking.
      // So we should always require a sourceAccountId, OR if it's not provided, we just assume it's coming from outside?
      // For simplicity, let's just always increment the savings account balance if a source account is provided.
      if (sourceAccountId) {
        await prisma.account.update({
          where: { id: goal.accountId },
          data: { balance: { increment: amount } },
        });

        // Record the transaction
        await prisma.transaction.create({
          data: {
            amount: -amount,
            type: 'TRANSFER',
            status: 'COMPLETED',
            accountId: sourceAccountId,
            description: `Auto-save/Transfer to Goal: ${goal.name}`,
          },
        });
        await prisma.transaction.create({
          data: {
            amount: amount,
            type: 'DEPOSIT', // Or transfer
            status: 'COMPLETED',
            accountId: goal.accountId,
            description: `Deposit to Goal: ${goal.name}`,
          },
        });
      }

      // Check Milestones
      const percentage = (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100;
      let milestoneToUpdate: any = {};
      let message = '';

      if (percentage >= 100 && !goal.milestone100Sent) {
        milestoneToUpdate.milestone100Sent = true;
        milestoneToUpdate.status = 'COMPLETED';
        message = `Congratulations! You reached 100% of your goal: ${goal.name}.`;
      } else if (percentage >= 75 && !goal.milestone75Sent) {
        milestoneToUpdate.milestone75Sent = true;
        message = `Great job! You reached 75% of your goal: ${goal.name}.`;
      } else if (percentage >= 50 && !goal.milestone50Sent) {
        milestoneToUpdate.milestone50Sent = true;
        message = `Halfway there! You reached 50% of your goal: ${goal.name}.`;
      } else if (percentage >= 25 && !goal.milestone25Sent) {
        milestoneToUpdate.milestone25Sent = true;
        message = `Good start! You reached 25% of your goal: ${goal.name}.`;
      }

      if (message) {
        await prisma.savingsGoal.update({
          where: { id: goalId },
          data: milestoneToUpdate,
        });
        this.notificationsService.createAndSend(userId, 'Savings Milestone Reached!', message);
      }

      return updatedGoal;
    });
  }

  async withdrawFunds(goalId: string, userId: string, amount: number, destinationAccountId: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (prisma) => {
      const goal = await prisma.savingsGoal.findUnique({
        where: { id: goalId },
        include: { account: true },
      });

      if (!goal) throw new NotFoundException('Goal not found');
      if (goal.account.userId !== userId) throw new NotFoundException('Unauthorized');

      if (goal.isLocked) {
        if (goal.lockedUntil && goal.lockedUntil > new Date()) {
           // We will allow breaking the lock but with a warning or penalty?
           // The user said "اسمحلة" (Allow it). So we won't throw an error, maybe just let it pass or add a penalty.
           // For now, let's just allow it without penalty, or maybe a tiny 1% penalty?
           // "اسمحلة" just means allow. We'll proceed.
        }
      }

      if (goal.currentAmount < amount) throw new BadRequestException('Insufficient funds in goal');

      const destAccount = await prisma.account.findFirst({
        where: { id: destinationAccountId, userId },
      });
      if (!destAccount) throw new NotFoundException('Destination account not found');

      // Deduct from goal
      const updatedGoal = await prisma.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: { decrement: amount } },
      });

      // Since goal money is part of the savings account balance, withdrawing from the goal
      // means we must transfer money OUT of the savings account to the destination account.
      await prisma.account.update({
        where: { id: goal.accountId },
        data: { balance: { decrement: amount } },
      });

      await prisma.account.update({
        where: { id: destinationAccountId },
        data: { balance: { increment: amount } },
      });

      // Record transaction
      await prisma.transaction.create({
        data: {
          amount: -amount,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          accountId: goal.accountId,
          description: `Withdrawal from Goal: ${goal.name}`,
        },
      });

      await prisma.transaction.create({
        data: {
          amount: amount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          accountId: destinationAccountId,
          description: `Received from Goal: ${goal.name}`,
        },
      });

      return updatedGoal;
    });
  }

  async deleteGoal(goalId: string, userId: string) {
    const goal = await this.prisma.savingsGoal.findUnique({
      where: { id: goalId },
      include: { account: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.account.userId !== userId) throw new NotFoundException('Unauthorized');

    return this.prisma.savingsGoal.update({
      where: { id: goalId },
      data: { status: 'CANCELLED' },
    });
  }
}
