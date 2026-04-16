import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  // AuthModule provides JwtAuthGuard via JwksService DI.
  // RoadmapModule exports PythonService (request-scoped, with retry +
  // X-Request-ID forwarding); we reuse it for chat calls to FastAPI.
  imports: [AuthModule, RoadmapModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
