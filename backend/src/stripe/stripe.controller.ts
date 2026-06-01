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
  async createPaymentIntent(@Req() req: any, @Body('amount') amount: number) {
    return this.stripeService.createPaymentIntent(req.user.userId, amount);
  }

  @Post('webhook')
  async webhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    return this.stripeService.handleWebhook(signature, req.rawBody as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-test-deposit')
  async confirmTestDeposit(@Req() req: any, @Body('amount') amount: number) {
    // Only allow this endpoint in local testing without a real webhook
    if (process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_placeholder') {
      return { success: false, message: 'Not allowed in production' };
    }
    
    const account = await this.stripeService['prisma'].account.findFirst({
      where: { userId: req.user.userId, type: 'CHECKING' },
    });
    
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
