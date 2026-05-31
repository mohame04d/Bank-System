import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountType } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  async getAccounts(@Req() req: any) {
    return this.accountsService.getUserAccounts(req.user.userId);
  }

  @Get(':id')
  async getAccountDetails(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.getAccountDetails(id, req.user.userId);
  }

  @Post()
  async createAccount(@Body('type') type: AccountType, @Req() req: any) {
    return this.accountsService.createSubAccount(req.user.userId, type || AccountType.SAVINGS);
  }
}
