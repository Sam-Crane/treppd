import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotScheduler } from './slot-scheduler';

/**
 * Phase 3d — Appointment Email Generator + Phase 4 — Slot Alerts (WS7).
 *
 * AuthModule provides JwtAuthGuard via JwksService DI.
 * RoadmapModule exports the request-scoped PythonService for the
 * /ai/appointment-email proxy. NotificationsModule provides NotificationsService
 * (push delivery + dedupe) for the SlotScheduler.
 */
@Module({
  imports: [AuthModule, RoadmapModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotScheduler],
})
export class AppointmentsModule {}
