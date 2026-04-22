import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { jwtVerify, errors as joseErrors } from 'jose';
import type { Request } from 'express';
import { JwksService } from './jwks.service';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email?: string;
  };
}

// Supabase currently signs with ES256 (ECDSA P-256). RS256 also accepted
// for older projects that used asymmetric RSA keys. HS256 is explicitly
// excluded — those are legacy symmetric tokens that should not reach here.
const ACCEPTED_ALGORITHMS = ['ES256', 'RS256'] as const;

/**
 * Verifies Supabase-issued access tokens LOCALLY using the project's
 * public keys (fetched once from the JWKS endpoint and cached in memory).
 *
 * Why local verification:
 * - Zero network overhead per request after first JWKS fetch
 * - Works with Supabase's modern asymmetric signing keys (ES256, ECC P-256);
 *   there is no shared JWT secret to distribute or rotate
 * - Signature, expiry, issuer, and algorithm all checked in a single
 *   `jose.jwtVerify` call
 *
 * On success, attaches `{ userId, email }` to `request.user` so
 * `@CurrentUser()` continues to work.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwks: JwksService,
    private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);

    try {
      const { payload } = await jwtVerify(token, this.jwks.getKeyResolver(), {
        issuer: this.jwks.issuer,
        algorithms: [...ACCEPTED_ALGORITHMS],
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Token missing subject');
      }

      request.user = {
        userId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };

      return true;
    } catch (error) {
      // Translate jose error classes into concise log messages without
      // leaking token contents.
      const reason =
        error instanceof joseErrors.JWTExpired
          ? 'token expired'
          : error instanceof joseErrors.JWTClaimValidationFailed
            ? `claim validation failed: ${error.claim}`
            : error instanceof joseErrors.JWSSignatureVerificationFailed
              ? 'signature verification failed'
              : error instanceof joseErrors.JWSInvalid
                ? 'malformed JWT'
                : 'unknown verification error';

      this.logger.warn({ reason }, 'Rejected access token');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
