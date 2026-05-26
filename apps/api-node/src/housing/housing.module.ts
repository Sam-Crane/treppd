import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';

/** Housing module (Phase 4 — WS5): office finder + WBS/Wohngeld estimates. */
@Module({
  imports: [AuthModule, RoadmapModule],
  controllers: [HousingController],
  providers: [HousingService],
})
export class HousingModule {}
