import { z } from 'zod';

/**
 * Environment variable schema for the NestJS core API.
 * Validated at boot via ConfigModule.forRoot({ validate }).
 * Missing or malformed vars cause the process to exit with a readable error.
 */
export const envSchema = z.object({
  // Supabase. Tokens are verified locally via JWKS against SUPABASE_URL
  // (see apps/api-node/src/auth/jwks.service.ts), so no JWT secret is
  // required. Only the server-side secret key is consumed here; the
  // publishable (anon) key lives in the web app.
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),

  // Internal service communication
  PYTHON_SERVICE_URL: z.string().url(),
  INTERNAL_API_KEY: z
    .string()
    .min(16, 'INTERNAL_API_KEY must be at least 16 chars'),

  // Infra
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),

  // Optional (not yet used but declared for future wiring)
  FCM_SERVER_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),

  // Web Push / VAPID (Phase 3e). Both required when push is enabled; if
  // missing, the NotificationsModule refuses subscriptions with a clear
  // error rather than crashing at boot.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:hello@treppd.de'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // Throw a readable error so the user sees exactly what's missing
    throw new Error(
      `\n[env] Invalid or missing environment variables:\n${issues}\n`,
    );
  }
  return result.data;
}
