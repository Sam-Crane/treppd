import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

/** Service-provider directory (Phase 5) — read-only public listing for the app. */
@Module({
  imports: [AuthModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule {}
