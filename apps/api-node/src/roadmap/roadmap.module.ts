import { Module } from '@nestjs/common';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';
import { PythonService } from './python.service';

@Module({
  controllers: [RoadmapController],
  providers: [RoadmapService, PythonService],
  exports: [RoadmapService, PythonService],
})
export class RoadmapModule {}
