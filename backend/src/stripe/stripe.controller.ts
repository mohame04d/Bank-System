import { Controller, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  async createPaymentIntent(@Req() req: any, @Body('amount') amount: number, @Body('accountId') accountId?: string) {
    return this.stripeService.createPaymentIntent(req.user.userId, amount, accountId);
  }

  @Post('webhook')
  async webhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    return this.stripeService.handleWebhook(signature, req.rawBody as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-test-deposit')
  async confirmTestDeposit(@Req() req: any, @Body('amount') amount: number, @Body('accountId') accountId?: string) {
    let account;
    if (accountId) {
      account = await this.stripeService['prisma'].account.findUnique({
        where: { id: accountId },
      });
      if (account?.userId !== req.user.userId) {
         account = null;
      }
    } 
    if (!account) {
      account = await this.stripeService['prisma'].account.findFirst({
        where: { userId: req.user.userId, type: 'CHECKING' },
      });
    }
    if (!account) {
      account = await this.stripeService['prisma'].account.findFirst({
        where: { userId: req.user.userId },
      });
    }
    
    if (!account) {
      return { success: false, message: 'No active bank account found for deposit' };
    }
    
    if (account) {
      await this.stripeService['prisma'].$transaction(async (prisma: any) => {
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: amount } },
        });
        await prisma.transaction.create({
          data: {
            amount: amount,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            accountId: account.id,
            referenceId: 'test_dep_' + Date.now(),
            description: 'Card Deposit',
          },
        });
      });
    }
    return { success: true };
  }
}
