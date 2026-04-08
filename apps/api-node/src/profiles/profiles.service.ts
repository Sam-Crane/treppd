/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findByUserId(userId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // PGRST116 = no rows found
    if (error && error.code !== 'PGRST116') throw error;
    return data as Record<string, unknown> | null;
  }

  async create(
    userId: string,
    dto: CreateProfileDto,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .insert({ user_id: userId, ...dto })
      .select()
      .single();

    if (error) {
      if (error.code === '23505')
        throw new ConflictException('Profile already exists');
      throw error;
    }
    return data as Record<string, unknown>;
  }

  async update(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('user_profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116')
        throw new NotFoundException('Profile not found');
      throw error;
    }

    // Invalidate active roadmap (triggers regeneration on next request)
    await client.from('user_roadmaps').delete().eq('user_id', userId);

    return data as Record<string, unknown>;
  }

  async delete(userId: string) {
    const { error } = await this.supabase
      .getClient()
      .auth.admin.deleteUser(userId);
    if (error) throw error;
    return { message: 'All user data deleted' };
  }
}
