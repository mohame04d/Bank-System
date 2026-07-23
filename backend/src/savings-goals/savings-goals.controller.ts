import { Controller, Get, Post, Body, Param, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AutoSaveFrequency } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get('account/:accountId')
  async getGoals(@Param('accountId') accountId: string, @Req() req: any) {
    return this.savingsGoalsService.getGoals(accountId, req.user.userId);
  }

  @Post('account/:accountId')
  async createGoal(
    @Param('accountId') accountId: string,
    @Req() req: any,
    @Body() data: {
      name: string;
      targetAmount: number;
      targetDate?: string;
      autoSaveAmount?: number;
      autoSaveFrequency?: AutoSaveFrequency;
      sourceAccountId?: string;
      isLocked?: boolean;
      lockedUntil?: string;
    }
  ) {
    return this.savingsGoalsService.createGoal(accountId, req.user.userId, {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : undefined,
    });
  }

  @Post(':goalId/add-funds')
  async addFunds(
    @Param('goalId') goalId: string,
    @Req() req: any,
    @Body() data: { amount: number; sourceAccountId: string }
  ) {
    return this.savingsGoalsService.addFunds(goalId, req.user.userId, data.amount, data.sourceAccountId);
  }

  @Post(':goalId/withdraw')
  async withdrawFunds(
    @Param('goalId') goalId: string,
    @Req() req: any,
    @Body() data: { amount: number; destinationAccountId: string }
  ) {
    return this.savingsGoalsService.withdrawFunds(goalId, req.user.userId, data.amount, data.destinationAccountId);
  }

  @Delete(':goalId')
  async deleteGoal(@Param('goalId') goalId: string, @Req() req: any) {
    return this.savingsGoalsService.deleteGoal(goalId, req.user.userId);
  }
}
