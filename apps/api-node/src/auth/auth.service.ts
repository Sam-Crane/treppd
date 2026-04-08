/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(email: string, password: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (error) throw new ConflictException(error.message);

    const { data: session, error: loginError } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password });
    if (loginError) throw new UnauthorizedException(loginError.message);

    return {
      access_token: session.session?.access_token,
      refresh_token: session.session?.refresh_token,
      user: data.user,
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.signInWithPassword({ email, password });
    if (error) throw new UnauthorizedException(error.message);

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.user,
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw new UnauthorizedException(error.message);

    return { access_token: data.session?.access_token };
  }

  logout() {
    return { message: 'Logged out' };
  }

  async getUser(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('*, user_profiles(*)')
      .eq('id', userId)
      .single();
    if (error) throw new UnauthorizedException('User not found');
    return data as Record<string, unknown>;
  }
}
