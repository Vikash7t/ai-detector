import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { UsageService } from './usage.service';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [UsageService, ReconciliationService],
  exports: [UsageService],
})
export class UsageModule {}
