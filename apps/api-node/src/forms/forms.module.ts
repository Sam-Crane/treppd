import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

/**
 * Form-Filling Guide module (Phase 3c).
 *
 * AuthModule provides JwtAuthGuard via JwksService DI.
 * RoadmapModule exports the request-scoped PythonService (with retry +
 * X-Request-ID forwarding) which we reuse for /ai/explain-field calls.
 */
@Module({
  imports: [AuthModule, RoadmapModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
