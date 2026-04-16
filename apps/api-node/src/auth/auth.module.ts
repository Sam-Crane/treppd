import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwksService } from './jwks.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwksService],
  exports: [AuthService, JwtAuthGuard, JwksService],
})
export class AuthModule {}
