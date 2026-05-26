import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';
import { WbsEstimateDto, WohngeldEstimateDto } from './dto/estimate.dto';

@Injectable()
export class HousingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly python: PythonService,
    private readonly logger: Logger,
  ) {}

  /** Housing offices, optionally narrowed to a city. Direct table read. */
  async listOffices(bundesland?: string, city?: string): Promise<unknown[]> {
    let query = this.supabase.getClient().from('housing_offices').select('*');
    if (bundesland) query = query.eq('bundesland', bundesland);
    if (city) query = query.eq('city', city);
    const { data, error } = await query.order('city');
    if (error) {
      this.logger.error(
        { reason: error.message },
        'Housing office list failed',
      );
      throw new ServiceUnavailableException('Could not load housing offices');
    }
    return (data as unknown[]) ?? [];
  }

  async wbs(dto: WbsEstimateDto): Promise<Record<string, unknown>> {
    const result = await this.python.housingWbs({ ...dto });
    return this.degradeIfNull(result, 'WBS');
  }

  async wohngeld(dto: WohngeldEstimateDto): Promise<Record<string, unknown>> {
    const result = await this.python.housingWohngeld({ ...dto });
    return this.degradeIfNull(result, 'Wohngeld');
  }

  /** When Python is down, return a useful, honest fallback rather than 500. */
  private degradeIfNull(
    result: Record<string, unknown> | null,
    label: string,
  ): Record<string, unknown> {
    if (result) return result;
    return {
      eligible: null,
      indicator: 'unknown',
      explanation: `${label} estimate is temporarily unavailable.`,
      disclaimer:
        'Estimate only — not a legal determination. Educational guidance, not legal advice.',
      next_step:
        'Please try again shortly or contact your local housing office.',
      fallback: true,
    };
  }
}
