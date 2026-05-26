/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';
import type {
  GenerateAppointmentEmailDto,
  OfficeDetailsDto,
} from './dto/generate.dto';
import type { CreateWatchDto } from './dto/watch.dto';

export interface AppointmentEmailResult {
  subject: string;
  body: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pythonService: PythonService,
    private readonly logger: Logger,
  ) {}

  /** Load the user's profile — we need visa_type + bundesland for calibration. */
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
        'Profile not found. Complete onboarding before generating an appointment email.',
      );
    }
    return data as Record<string, unknown>;
  }

  /** Proxy an appointment-email request to FastAPI /ai/appointment-email. */
  async generate(
    userId: string,
    dto: GenerateAppointmentEmailDto,
  ): Promise<AppointmentEmailResult> {
    const profile = await this.getUserProfile(userId);
    const office: OfficeDetailsDto = dto.office_details;

    const userProfilePayload = {
      user_id: userId,
      visa_type: profile.visa_type ?? null,
      bundesland: profile.bundesland ?? null,
      nationality: profile.nationality ?? null,
      goal: profile.goal ?? null,
      full_name:
        (profile.full_name as string | undefined) ??
        (profile.applicant_name as string | undefined) ??
        null,
      applicant_email: profile.applicant_email ?? profile.email ?? null,
      applicant_phone: profile.applicant_phone ?? profile.phone ?? null,
    };

    const result = await this.pythonService.appointmentEmail({
      process_type: dto.process_type,
      user_profile: userProfilePayload,
      office_details: {
        name: office.name,
        email: office.email,
        phone: office.phone ?? null,
        requested_dates: office.requested_dates ?? [],
      },
    });

    if (!result) {
      throw new ServiceUnavailableException(
        'Appointment email generator is temporarily unavailable. Please try again in a moment.',
      );
    }

    const typed = result as unknown as { subject: string; body: string };
    return {
      subject: typed.subject ?? '',
      body: typed.body ?? '',
    };
  }

  // ----------------------------------------------------- slot watches (WS7)

  async listWatches(userId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('appointment_watches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      this.logger.warn({ err: error }, 'Failed to list watches');
      return [];
    }
    return (data as unknown[]) ?? [];
  }

  async createWatch(
    userId: string,
    dto: CreateWatchDto,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .getClient()
      .from('appointment_watches')
      .insert({
        user_id: userId,
        office_id: dto.office_id ?? null,
        booking_url: dto.booking_url,
        service_label: dto.service_label ?? null,
      })
      .select('*')
      .single();
    if (error || !data) {
      this.logger.warn({ err: error }, 'Failed to create watch');
      throw new ServiceUnavailableException('Could not create watch.');
    }
    return data as Record<string, unknown>;
  }

  async deleteWatch(userId: string, watchId: string): Promise<{ ok: true }> {
    const { error } = await this.supabase
      .getClient()
      .from('appointment_watches')
      .delete()
      .eq('user_id', userId)
      .eq('id', watchId);
    if (error) {
      this.logger.warn({ err: error }, 'Failed to delete watch');
      throw new NotFoundException('Watch not found.');
    }
    return { ok: true };
  }
}
