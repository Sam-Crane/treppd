/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';
import {
  MAX_SESSION_KEYS,
  MAX_SESSION_VALUE_LENGTH,
} from './dto/save-session.dto';

export interface FormSummary {
  id: string;
  form_code: string;
  name_de: string;
  name_en: string;
  bundeslaender: string[];
  visa_types: string[];
  related_step_slug: string | null;
  download_url: string | null;
  verified_at: string;
  field_count: number;
}

export interface FormField {
  field_id: string;
  label_de: string;
  label_en: string;
  input_type: 'text' | 'date' | 'checkbox' | 'select' | 'number';
  instructions_en: string;
  common_mistakes: string[];
  example_value: string;
  required: boolean;
  ai_can_explain: boolean;
}

export interface FormRecord extends Omit<FormSummary, 'field_count'> {
  fields: FormField[];
}

@Injectable()
export class FormsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pythonService: PythonService,
    private readonly logger: Logger,
  ) {}

  /** Pull the user's profile — required to filter applicable forms. */
  private async getUserProfile(
    userId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException(
        'Profile not found. Complete onboarding before using Form Guide.',
      );
    }
    return data as Record<string, unknown>;
  }

  /**
   * Return every form applicable to the user (visa & Bundesland filter),
   * without the heavy `fields` JSONB. The listing page doesn't need it.
   */
  async listForUser(userId: string): Promise<FormSummary[]> {
    const profile = await this.getUserProfile(userId);
    const visaType = (profile.visa_type as string) ?? '';
    const bundesland = (profile.bundesland as string) ?? '';

    const { data, error } = await this.supabase
      .getClient()
      .from('forms')
      .select(
        'id, form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, download_url, verified_at, fields',
      );

    if (error || !data) {
      this.logger.warn({ err: error }, 'Failed to load forms list');
      return [];
    }

    return (data as Array<Record<string, unknown>>)
      .filter((row) => {
        const visaTypes = (row.visa_types as string[] | null) ?? [];
        const bundeslaender = (row.bundeslaender as string[] | null) ?? [];
        const visaOk =
          visaTypes.length === 0 ||
          (visaType !== '' && visaTypes.includes(visaType));
        const bundeslandOk =
          bundeslaender.length === 0 ||
          (bundesland !== '' && bundeslaender.includes(bundesland));
        return visaOk && bundeslandOk;
      })
      .map((row) => ({
        id: row.id as string,
        form_code: row.form_code as string,
        name_de: row.name_de as string,
        name_en: row.name_en as string,
        bundeslaender: (row.bundeslaender as string[] | null) ?? [],
        visa_types: (row.visa_types as string[] | null) ?? [],
        related_step_slug: (row.related_step_slug as string) ?? null,
        download_url: (row.download_url as string) ?? null,
        verified_at: row.verified_at as string,
        field_count: Array.isArray(row.fields) ? row.fields.length : 0,
      }));
  }

  /** Full form (including fields) for the Guide page. */
  async getByCode(userId: string, formCode: string): Promise<FormRecord> {
    const profile = await this.getUserProfile(userId);
    const visaType = (profile.visa_type as string) ?? '';
    const bundesland = (profile.bundesland as string) ?? '';

    const { data, error } = await this.supabase
      .getClient()
      .from('forms')
      .select('*')
      .eq('form_code', formCode)
      .maybeSingle();

    if (error) {
      this.logger.warn({ err: error, formCode }, 'Failed to load form by code');
      throw new NotFoundException('Form not found.');
    }
    if (!data) {
      throw new NotFoundException('Form not found.');
    }

    const row = data as Record<string, unknown>;
    const bundeslaender = (row.bundeslaender as string[] | null) ?? [];
    const visaTypes = (row.visa_types as string[] | null) ?? [];
    const applies =
      (visaTypes.length === 0 || visaTypes.includes(visaType)) &&
      (bundeslaender.length === 0 || bundeslaender.includes(bundesland));
    if (!applies) {
      // Hide inapplicable forms so a Bavaria user can't discover Berlin forms
      // by guessing URLs. Same response as if the form didn't exist.
      throw new NotFoundException('Form not found.');
    }

    return {
      id: row.id as string,
      form_code: row.form_code as string,
      name_de: row.name_de as string,
      name_en: row.name_en as string,
      bundeslaender,
      visa_types: visaTypes,
      related_step_slug: (row.related_step_slug as string) ?? null,
      download_url: (row.download_url as string) ?? null,
      verified_at: row.verified_at as string,
      fields: (row.fields as FormField[] | null) ?? [],
    };
  }

  /** Proxy field explanation request to FastAPI /ai/explain-field. */
  async explainField(
    userId: string,
    formCode: string,
    fieldId: string,
  ): Promise<{ explanation: string; tips: string[]; example: string }> {
    const profile = await this.getUserProfile(userId);

    // Defensive 404: caller must be allowed to view this form. This also
    // guarantees the form is in scope before we spend Claude tokens.
    await this.getByCode(userId, formCode);

    const userContext = {
      user_id: userId,
      visa_type: profile.visa_type ?? null,
      bundesland: profile.bundesland ?? null,
      nationality: profile.nationality ?? null,
      goal: profile.goal ?? null,
    };

    const result = await this.pythonService.explainField({
      form_code: formCode,
      field_id: fieldId,
      user_context: userContext,
    });

    if (!result) {
      throw new ServiceUnavailableException(
        'Field explanation is temporarily unavailable. Please try again shortly.',
      );
    }

    // Cast through unknown so TS doesn't complain about the Record<string, unknown>.
    const typed = result as unknown as {
      explanation: string;
      tips: string[];
      example: string;
    };
    return {
      explanation: typed.explanation ?? '',
      tips: Array.isArray(typed.tips) ? typed.tips : [],
      example: typed.example ?? '',
    };
  }

  /** Get saved progress for (user, form). Returns empty values if none. */
  async getSession(
    userId: string,
    formCode: string,
  ): Promise<{ values: Record<string, unknown>; updated_at: string | null }> {
    const { data, error } = await this.supabase
      .getClient()
      .from('form_sessions')
      .select('values, updated_at')
      .eq('user_id', userId)
      .eq('form_code', formCode)
      .maybeSingle();

    if (error) {
      this.logger.warn(
        { err: error, userId, formCode },
        'Failed to load form session',
      );
      return { values: {}, updated_at: null };
    }

    if (!data) return { values: {}, updated_at: null };

    const row = data as { values: Record<string, unknown>; updated_at: string };
    return {
      values: row.values ?? {},
      updated_at: row.updated_at ?? null,
    };
  }

  /** Upsert progress for (user, form). Rejects oversized payloads. */
  async saveSession(
    userId: string,
    formCode: string,
    values: Record<string, string | number | boolean>,
  ): Promise<{ ok: true; updated_at: string }> {
    const keyCount = Object.keys(values).length;
    if (keyCount > MAX_SESSION_KEYS) {
      throw new BadRequestException(
        `Too many fields in session payload (got ${keyCount}, max ${MAX_SESSION_KEYS}).`,
      );
    }
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === 'string' && v.length > MAX_SESSION_VALUE_LENGTH) {
        throw new BadRequestException(
          `Value for field '${k}' is too long (${v.length} chars, max ${MAX_SESSION_VALUE_LENGTH}).`,
        );
      }
    }

    // Confirm the form exists and is applicable to the user before saving.
    await this.getByCode(userId, formCode);

    const { data, error } = await this.supabase
      .getClient()
      .from('form_sessions')
      .upsert(
        {
          user_id: userId,
          form_code: formCode,
          values,
        },
        { onConflict: 'user_id,form_code' },
      )
      .select('updated_at')
      .maybeSingle();

    if (error || !data) {
      this.logger.warn(
        { err: error, userId, formCode },
        'Failed to upsert form session',
      );
      throw new ServiceUnavailableException('Could not save form progress.');
    }

    const row = data as { updated_at: string };
    return { ok: true, updated_at: row.updated_at };
  }

  /** Reset button / GDPR erasure. */
  async clearSession(userId: string, formCode: string): Promise<{ ok: true }> {
    const { error } = await this.supabase
      .getClient()
      .from('form_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('form_code', formCode);

    if (error) {
      this.logger.warn(
        { err: error, userId, formCode },
        'Failed to clear form session',
      );
    }
    return { ok: true };
  }
}
