import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Admin content-management module (Phase 4).
 *
 * AuthModule provides JwtAuthGuard + AdminGuard. RoadmapModule exports the
 * request-scoped PythonService reused to proxy /admin/ingest.
 */
@Module({
  imports: [AuthModule, RoadmapModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
