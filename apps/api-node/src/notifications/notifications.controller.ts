import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { DeadlineScheduler } from './deadline-scheduler';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly pushService: PushService,
    private readonly scheduler: DeadlineScheduler,
    private readonly config: ConfigService,
  ) {}

  /** Public: frontend reads the VAPID public key to build a subscription. */
  @Get('vapid-public-key')
  vapidPublicKey() {
    return { key: this.pushService.getPublicKey() };
  }

  // ---- user-scoped: JWT-protected -----------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubscribeDto,
  ) {
    return this.service.subscribe(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscribe')
  unsubscribe(
    @CurrentUser() user: { userId: string },
    @Query('endpoint') endpoint: string,
  ) {
    return this.service.unsubscribe(user.userId, endpoint);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  getPreferences(@CurrentUser() user: { userId: string }) {
    return this.service.getPreferences(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.service.updatePreferences(user.userId, dto);
  }

  /** Dev-only: send a test push to the current user. */
  @UseGuards(JwtAuthGuard)
  @Post('test')
  sendTest(@CurrentUser() user: { userId: string }) {
    return this.service.sendTestPush(user.userId);
  }

  // ---- internal: behind X-Internal-Key, used for manual scheduler runs ---

  /**
   * Manually trigger the deadline scan. Requires X-Internal-Key header.
   * Useful during staging / after a cron downtime to catch up.
   */
  @Post('run-scheduler')
  async runScheduler(@Headers('x-internal-key') internalKey?: string) {
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (!expected || internalKey !== expected) {
      throw new ForbiddenException('Invalid X-Internal-Key.');
    }
    return this.scheduler.runScan();
  }
}
