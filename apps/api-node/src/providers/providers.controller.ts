import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProvidersService } from './providers.service';

@ApiTags('providers')
@ApiBearerAuth()
@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /** Provider suggestions for a roadmap step. */
  @Get()
  list(@Query('step') step?: string) {
    if (!step) return [];
    return this.providersService.listForStep(step);
  }
}
