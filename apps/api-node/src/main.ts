import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging via Pino (replaces default NestJS logger)
  app.useLogger(app.get(Logger));

  // Security headers
  app.use(helmet());

  // CORS — production locks to the configured FRONTEND_URL(s) (comma-separated
  // allowlist). In development we also accept any localhost/127.0.0.1 port,
  // since the Next dev server drifts (3000 → 3001 → 3002…) when ports are busy.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Same-origin / curl / server-to-server requests have no Origin header.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API docs (dev and staging only — not production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Treppd Core API')
      .setDescription('Public-facing API for the Treppd PWA client')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  // Bind to all interfaces so GitHub Codespaces / Docker can forward the
  // port; localhost-only binding would 502 the public forwarded URL.
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`Treppd core API listening on :${port}`);
}
void bootstrap();
