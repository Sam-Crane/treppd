import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

/**
 * Phase 3d — Appointment Email Generator.
 *
 * AuthModule provides JwtAuthGuard via JwksService DI.
 * RoadmapModule exports the request-scoped PythonService which we reuse
 * for the /ai/appointment-email proxy call.
 */
@Module({
  imports: [AuthModule, RoadmapModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
