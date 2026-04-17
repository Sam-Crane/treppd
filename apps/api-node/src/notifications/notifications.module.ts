import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { DeadlineScheduler } from './deadline-scheduler';

/**
 * Phase 3e — Deadline Alerts + Push Notifications.
 *
 * AuthModule provides the JwtAuthGuard used on user-scoped endpoints.
 * ScheduleModule.forRoot() wires in the nestjs-schedule discovery so
 * @Cron decorators on DeadlineScheduler fire automatically.
 */
@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, DeadlineScheduler],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
