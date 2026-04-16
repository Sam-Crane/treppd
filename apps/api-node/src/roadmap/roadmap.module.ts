import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { PythonService } from './python.service';

@Module({
  imports: [AuthModule],
  controllers: [RoadmapController],
  providers: [RoadmapService, PythonService],
  exports: [RoadmapService, PythonService],
})
export class RoadmapModule {}
