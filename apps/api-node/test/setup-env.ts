/**
 * Stub env vars for e2e tests BEFORE AppModule is imported.
 * AppModule's ConfigModule.forRoot({ validate }) runs at module load time
 * and throws on missing required vars.
 *
 * These values are fake but pass schema validation (URL format, min length).
 * Tests that exercise real Supabase/Anthropic integrations would need live
 * credentials; our e2e suite currently only hits /, /health, /auth/* (401),
 * so stubs are enough.
 */

const defaults: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  PYTHON_SERVICE_URL: 'http://localhost:8000',
  INTERNAL_API_KEY: 'test-internal-key-long-enough-16',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
