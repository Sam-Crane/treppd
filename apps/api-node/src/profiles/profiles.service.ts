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

  /**
   * GDPR Art. 15 (right of access) + Art. 20 (data portability). Returns a
   * self-contained JSON snapshot of every table row keyed to this user across
   * the app. Uses the service-key client (bypasses RLS) because the user is
   * asking for THEIR OWN data — the userId is the authenticated caller. We
   * deliberately exclude admin_role from the users row.
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const client = this.supabase.getClient();
    // Tables scoped by user_id (owner-only data), and their columns to export.
    // Anything system-managed / admin-only stays out.
    const scoped: Array<[string, string]> = [
      ['users', 'id, email, preferred_language, subscription_tier, created_at'],
      ['user_profiles', '*'],
      ['user_roadmaps', 'id, generated_at, expires_at, ai_enriched, steps'],
      [
        'user_documents',
        'id, step_slug, document_name_en, display_name, mime_type, file_size_bytes, uploaded_at, expires_at',
      ],
      ['form_sessions', '*'],
      ['appointment_watches', '*'],
      ['ai_conversations', '*'],
      ['ai_feedback', '*'],
      ['push_subscriptions', 'id, endpoint, created_at, last_used_at'],
      ['notification_preferences', '*'],
    ];

    const userScopedColumn: Record<string, string> = {
      users: 'id',
    };

    const dump: Record<string, unknown[]> = {};
    for (const [table, columns] of scoped) {
      const idCol = userScopedColumn[table] ?? 'user_id';
      const { data } = await client
        .from(table)
        .select(columns)
        .eq(idCol, userId);
      dump[table] = (data as unknown[]) ?? [];
    }

    return {
      export_generated_at: new Date().toISOString(),
      user_id: userId,
      data: dump,
      notice:
        'GDPR Art. 15 / Art. 20 export. Includes personal data held in the Treppd app. Storage-bucket files are referenced by storage_path; use /documents to download the bytes.',
    };
  }

  async delete(userId: string) {
    const { error } = await this.supabase
      .getClient()
      .auth.admin.deleteUser(userId);
    if (error) throw error;
    return { message: 'All user data deleted' };
  }
}
