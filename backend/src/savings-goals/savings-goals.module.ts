import { Module } from '@nestjs/common';
import { SavingsGoalsController } from './savings-goals.controller';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsCronService } from './savings-cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SavingsGoalsController],
  providers: [SavingsGoalsService, SavingsCronService],
  exports: [SavingsGoalsService],
})
export class SavingsGoalsModule {}
