import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AppointmentsService } from './appointments.service';
import { GenerateAppointmentEmailDto, PROCESS_TYPES } from './dto/generate.dto';

/**
 * Appointment email generator calls Claude per request; the Python side
 * caches (process, visa, bundesland, dates) for 60 min, but we still cap
 * the user-facing rate to prevent spam. 10/hr is generous for normal use.
 */
const APPOINTMENT_THROTTLE = { default: { limit: 10, ttl: 3_600_000 } };

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Static list of supported process-type keys for the frontend picker. */
  @Get('process-types')
  processTypes() {
    return {
      types: PROCESS_TYPES.map((key) => ({ key })),
    };
  }

  @Throttle(APPOINTMENT_THROTTLE)
  @Post('generate')
  generate(
    @CurrentUser() user: { userId: string },
    @Body() dto: GenerateAppointmentEmailDto,
  ) {
    return this.appointmentsService.generate(user.userId, dto);
  }
}
