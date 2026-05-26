import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';

export interface ServiceProvider {
  id: string;
  category: string;
  name: string;
  url: string;
  logo_url: string | null;
  description_en: string | null;
  is_affiliate: boolean;
  affiliate_url: string | null;
  sort_order: number;
}

@Injectable()
export class ProvidersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) {}

  /** Providers relevant to a roadmap step, ordered by category then sort_order. */
  async listForStep(stepSlug: string): Promise<ServiceProvider[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('service_providers')
      .select(
        'id, category, name, url, logo_url, description_en, is_affiliate, affiliate_url, sort_order',
      )
      .contains('relevant_step_slugs', [stepSlug])
      .order('category')
      .order('sort_order');

    if (error) {
      this.logger.warn({ reason: error.message }, 'Provider lookup failed');
      throw new ServiceUnavailableException('Could not load providers');
    }
    return (data as ServiceProvider[]) ?? [];
  }
}
