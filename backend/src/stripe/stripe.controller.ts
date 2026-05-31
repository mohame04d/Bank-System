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
    // Note: To use RawBodyRequest, we need to configure NestJS to provide raw body buffer
    return this.stripeService.handleWebhook(signature, req.rawBody as any);
  }
}
