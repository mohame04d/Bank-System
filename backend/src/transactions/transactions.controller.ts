import { Controller, Get, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.transactionsService.getHistory(req.user.userId);
  }

  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    return this.transactionsService.getAnalytics(req.user.userId);
  }

  @Get('export')
  async exportHistory(@Req() req: any) {
    return this.transactionsService.exportHistory(req.user.userId);
  }

  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body('fromAccountId') fromAccountId: string,
    @Body('toAccountNumber') toAccountNumber: string,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.transactionsService.transfer(
      req.user.userId,
      fromAccountId,
      toAccountNumber,
      amount,
      description,
    );
  }

  @Get('admin/all')
  async getAllSystemTransactions(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.transactionsService.getAllSystemTransactions();
  }
}
