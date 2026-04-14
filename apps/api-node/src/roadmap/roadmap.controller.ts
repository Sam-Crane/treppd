import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { RoadmapService } from './roadmap.service';
import { CompleteStepDto } from './dto/complete-step.dto';

@ApiTags('roadmap')
@ApiBearerAuth()
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
    @Body() body: CompleteStepDto,
  ) {
    const completed = body.completed ?? true;
    return this.roadmapService.setStepCompletion(user.userId, slug, completed);
  }

  @Get('progress')
  getProgress(@CurrentUser() user: { userId: string }) {
    return this.roadmapService.getProgress(user.userId);
  }
}
