import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SavingsGoalsService } from './savings-goals.service';

@Injectable()
export class SavingsCronService {
  private readonly logger = new Logger(SavingsCronService.name);

  constructor(
    private prisma: PrismaService,
    private savingsGoalsService: SavingsGoalsService,
  ) {}

  // Run daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutoSaves() {
    this.logger.debug('Running auto-save cron job');
    
    const goalsWithAutoSave = await this.prisma.savingsGoal.findMany({
      where: {
        autoSaveAmount: { not: null },
        autoSaveFrequency: { not: null },
        sourceAccountId: { not: null },
        status: 'ACTIVE',
        account: {
          status: 'ACTIVE'
        }
      },
      include: { account: true },
    });

    const now = new Date();

    for (const goal of goalsWithAutoSave) {
      if (goal.currentAmount >= goal.targetAmount) {
        continue; // Goal reached, no need to auto-save
      }

      let shouldRun = false;
      
      // Basic frequency check (this is a simplified logic, usually we check last auto-save date)
      // For this demo, let's just use the current day/week/month to trigger
      if (goal.autoSaveFrequency === 'DAILY') {
        shouldRun = true;
      } else if (goal.autoSaveFrequency === 'WEEKLY' && now.getDay() === 1) { // Monday
        shouldRun = true;
      } else if (goal.autoSaveFrequency === 'MONTHLY' && now.getDate() === 1) { // 1st of month
        shouldRun = true;
      }

      if (shouldRun && goal.autoSaveAmount && goal.sourceAccountId) {
        try {
          await this.savingsGoalsService.addFunds(
            goal.id,
            goal.account.userId,
            goal.autoSaveAmount,
            goal.sourceAccountId,
          );
          this.logger.log(`Auto-saved ${goal.autoSaveAmount} to goal ${goal.id}`);
        } catch (error) {
          this.logger.error(`Failed to auto-save for goal ${goal.id}: ${error.message}`);
        }
      }
    }
  }
}
