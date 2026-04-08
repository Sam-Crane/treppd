import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  getRoadmap(@CurrentUser() user: { userId: string }) {
    return this.roadmapService.getActiveRoadmap(user.userId);
  }

  @Post('generate')
  generateRoadmap(@CurrentUser() user: { userId: string }) {
    return this.roadmapService.generateRoadmap(user.userId);
  }

  @Patch('steps/:slug/complete')
  completeStep(
    @CurrentUser() user: { userId: string },
    @Param('slug') slug: string,
  ) {
    return this.roadmapService.completeStep(user.userId, slug);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: { userId: string }) {
    return this.roadmapService.getProgress(user.userId);
  }
}
