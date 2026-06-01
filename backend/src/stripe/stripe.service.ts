import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: any;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2023-10-16' as any, // latest typings might differ
    });
  }

  async createPaymentIntent(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Assuming we want to deposit to their CHECKING account
    const account = await this.prisma.account.findFirst({
      where: { userId, type: 'CHECKING' },
    });

    if (!account) throw new BadRequestException('No eligible account found for deposit');

    // Bypass real Stripe API if using the placeholder key for local testing
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('sk_test_placeholder')) {
      return {
        clientSecret: 'mock_client_secret_for_local_testing',
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      metadata: {
        userId,
        accountId: account.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const accountId = paymentIntent.metadata.accountId;
      const amountInDollars = paymentIntent.amount / 100;

      if (accountId) {
        await this.prisma.$transaction(async (prisma: any) => {
          await prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: amountInDollars } },
          });

          await prisma.transaction.create({
            data: {
              amount: amountInDollars,
              type: 'DEPOSIT',
              status: 'COMPLETED',
              accountId: accountId,
              referenceId: paymentIntent.id,
              description: 'Card Deposit',
            },
          });
        });
      }
    }

    return { received: true };
  }
}
