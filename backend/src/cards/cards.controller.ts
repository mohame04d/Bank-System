import { Controller, Get, Post, Put, Body, Req, UseGuards, Param } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  getUserCards(@Req() req: any) {
    return this.cardsService.getUserCards(req.user.userId);
  }

  @Post()
  createVirtualCard(@Req() req: any, @Body('accountId') accountId: string) {
    return this.cardsService.createVirtualCard(req.user.userId, accountId);
  }

  @Put(':id/toggle')
  toggleCardStatus(@Req() req: any, @Param('id') cardId: string) {
    return this.cardsService.toggleCardStatus(req.user.userId, cardId);
  }

  @Put(':id/limit')
  setCardLimit(@Req() req: any, @Param('id') cardId: string, @Body('limit') limit: number) {
    return this.cardsService.setCardLimit(req.user.userId, cardId, limit);
  }
}
