import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppController } from './app.controller';
import { validateEnv } from './config/env.schema';
import { SupabaseModule } from './supabase/supabase.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RoadmapModule } from './roadmap/roadmap.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              },
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const existing = req.headers['x-request-id'];
          const id =
            typeof existing === 'string' && existing.length > 0
              ? existing
              : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        customProps: () => ({ service: 'api-node' }),
        serializers: {
          req: (req: { id?: string; method?: string; url?: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode?: number }) => ({
            statusCode: res.statusCode,
          }),
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-internal-key"]',
          ],
          remove: true,
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SupabaseModule,
    RedisModule,
    AuthModule,
    ProfilesModule,
    RoadmapModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
