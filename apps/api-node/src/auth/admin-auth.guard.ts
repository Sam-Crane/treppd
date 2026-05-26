import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email?: string;
  };
}

/**
 * Authorizes admin-only routes. MUST be stacked AFTER JwtAuthGuard so that
 * `request.user.userId` is already populated:
 *
 *   @UseGuards(JwtAuthGuard, AdminGuard)
 *
 * Looks up `users.admin_role` via the service-key client (bypasses RLS) and
 * rejects any user whose role is NULL. Any non-NULL role is treated as admin.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('admin_role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      this.logger.warn({ reason: error.message }, 'Admin role lookup failed');
      throw new ForbiddenException('Authorization check failed');
    }

    if (!data?.admin_role) {
      this.logger.warn({ userId }, 'Non-admin blocked from admin route');
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
