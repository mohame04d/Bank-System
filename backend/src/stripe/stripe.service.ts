import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StripeService {
  private stripe: any;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {
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
    console.log('--- WEBHOOK RECEIVED ---');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any;

    try {
      // Set tolerance to 1 day (86400 seconds) to bypass local clock drift issues
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret, 86400);
      console.log('Webhook verified successfully. Type:', event.type);
    } catch (err) {
      console.error('Webhook Verification Failed:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      console.log('Processing payment_intent.succeeded...');
      const paymentIntent = event.data.object as any;
      const accountId = paymentIntent.metadata.accountId;
      const amountInDollars = paymentIntent.amount / 100;
      console.log('Account ID:', accountId, 'Amount:', amountInDollars);

      if (accountId) {
        try {
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
          console.log('Successfully updated DB for webhook!');
          
          // Send real-time notification to the user
          this.notificationsService.createAndSend(
            paymentIntent.metadata.userId,
            'Deposit Successful',
            `An amount of $${amountInDollars} has been added to your account.`
          );
          
        } catch (dbError) {
          console.error('DB Update Failed:', dbError);
        }
      } else {
        console.error('No accountId found in payment intent metadata!');
      }
    } else {
      console.log('Unhandled event type:', event.type);
    }

    return { received: true };
  }
}
