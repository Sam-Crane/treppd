import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

/**
 * Singleton holder for the Supabase JWKS (JSON Web Key Set).
 *
 * `jose.createRemoteJWKSet` returns a key-resolver function that jose's
 * `jwtVerify` will call with the JWT header. The resolver fetches the
 * JWKS lazily on first use and then caches keys in-memory, honouring
 * Cache-Control headers from Supabase and transparently handling key
 * rotation when a new `kid` appears.
 *
 * Supabase signing keys endpoint:
 *   {SUPABASE_URL}/auth/v1/.well-known/jwks.json
 *
 * Expected algorithms: ES256 (modern default) or RS256 (some projects).
 * HS256 tokens are NOT asymmetric and will be rejected here — those
 * should not reach us because we disable the legacy HS256 path.
 */
@Injectable()
export class JwksService {
  private readonly logger = new Logger(JwksService.name);
  private readonly jwks: JWTVerifyGetKey;
  private readonly jwksUrl: string;
  readonly issuer: string;

  constructor(config: ConfigService) {
    const supabaseUrl = config.getOrThrow<string>('SUPABASE_URL');
    this.jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    this.issuer = `${supabaseUrl}/auth/v1`;

    this.jwks = createRemoteJWKSet(new URL(this.jwksUrl), {
      // Cache the fetched JWKS in-memory for 10 minutes. jose refetches
      // automatically when verification sees an unknown `kid`.
      cacheMaxAge: 10 * 60 * 1000,
      // Fail fast if the JWKS endpoint is unreachable.
      timeoutDuration: 5_000,
    });

    this.logger.log(`JWKS resolver ready: ${this.jwksUrl}`);
  }

  getKeyResolver(): JWTVerifyGetKey {
    return this.jwks;
  }
}
