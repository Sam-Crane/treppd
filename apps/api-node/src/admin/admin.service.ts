import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';
import { IngestDto } from './dto/ingest.dto';

/**
 * Maps the public `:resource` slug to a real table. The client never names a
 * table directly — only a slug from this whitelist — so there's no way to
 * read/write an arbitrary table. `idColumn` is the natural key used for
 * delete and upsert-conflict. `stampVerifiedAt` re-stamps verified_at on every
 * write to honour the data-integrity convention (a human just verified it).
 */
interface ResourceConfig {
  table: string;
  idColumn: string;
  stampVerifiedAt: boolean;
}

const RESOURCES: Record<string, ResourceConfig> = {
  'roadmap-steps': {
    table: 'roadmap_steps',
    idColumn: 'slug',
    stampVerifiedAt: true,
  },
  'document-requirements': {
    table: 'document_requirements',
    idColumn: 'id',
    stampVerifiedAt: false,
  },
  forms: { table: 'forms', idColumn: 'form_code', stampVerifiedAt: true },
  offices: { table: 'offices', idColumn: 'id', stampVerifiedAt: true },
  'housing-offices': {
    table: 'housing_offices',
    idColumn: 'id',
    stampVerifiedAt: true,
  },
  'housing-parameters': {
    table: 'housing_parameters',
    idColumn: 'key',
    stampVerifiedAt: true,
  },
  'requirement-tags': {
    table: 'requirement_tags',
    idColumn: 'tag',
    stampVerifiedAt: false,
  },
};

const ALLOWED_BUNDESLAENDER = new Set([
  'DE-BW',
  'DE-BY',
  'DE-BE',
  'DE-BB',
  'DE-HB',
  'DE-HH',
  'DE-HE',
  'DE-MV',
  'DE-NI',
  'DE-NW',
  'DE-RP',
  'DE-SL',
  'DE-SN',
  'DE-ST',
  'DE-SH',
  'DE-TH',
]);

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly python: PythonService,
    private readonly logger: Logger,
  ) {}

  /** Returns the caller's admin role (or null). Used by the UI to decide
   * whether to surface the Admin section — the real boundary is AdminGuard. */
  async whoami(
    userId: string,
  ): Promise<{ isAdmin: boolean; adminRole: string | null }> {
    const { data } = await this.supabase
      .getClient()
      .from('users')
      .select('admin_role')
      .eq('id', userId)
      .maybeSingle();
    const adminRole = (data?.admin_role as string | undefined) ?? null;
    return { isAdmin: adminRole !== null, adminRole };
  }

  private resolve(resource: string): ResourceConfig {
    const config = RESOURCES[resource];
    if (!config) {
      throw new NotFoundException(`Unknown content resource: ${resource}`);
    }
    return config;
  }

  /** Reject obviously invalid Bundesland codes before they reach the DB. */
  private validateBundeslaender(row: Record<string, unknown>): void {
    const single = row.bundesland;
    if (typeof single === 'string' && !ALLOWED_BUNDESLAENDER.has(single)) {
      throw new BadRequestException(`Invalid bundesland: ${single}`);
    }
    const many = row.bundeslaender;
    if (Array.isArray(many)) {
      const bad = (many as unknown[]).find(
        (b) => typeof b !== 'string' || !ALLOWED_BUNDESLAENDER.has(b),
      );
      if (bad !== undefined) {
        throw new BadRequestException(
          `Invalid bundesland: ${String(bad as string)}`,
        );
      }
    }
  }

  async list(resource: string): Promise<unknown[]> {
    const { table } = this.resolve(resource);
    const { data, error } = await this.supabase
      .getClient()
      .from(table)
      .select('*');
    if (error) {
      this.logger.error({ table, reason: error.message }, 'Admin list failed');
      throw new ServiceUnavailableException('Failed to list content');
    }
    return (data as unknown[]) ?? [];
  }

  async upsert(
    resource: string,
    row: Record<string, unknown>,
  ): Promise<unknown> {
    const { table, idColumn, stampVerifiedAt } = this.resolve(resource);
    this.validateBundeslaender(row);

    const payload = { ...row };
    if (stampVerifiedAt) {
      payload.verified_at = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = (await this.supabase
      .getClient()
      .from(table)
      .upsert(payload, { onConflict: idColumn })
      .select()
      .maybeSingle()) as {
      data: unknown;
      error: { message: string } | null;
    };

    if (error) {
      this.logger.warn({ table, reason: error.message }, 'Admin upsert failed');
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async remove(resource: string, id: string): Promise<{ ok: true }> {
    const { table, idColumn } = this.resolve(resource);
    const { error } = await this.supabase
      .getClient()
      .from(table)
      .delete()
      .eq(idColumn, id);
    if (error) {
      this.logger.warn({ table, reason: error.message }, 'Admin delete failed');
      throw new BadRequestException(error.message);
    }
    return { ok: true };
  }

  async ingest(dto: IngestDto): Promise<Record<string, unknown>> {
    const result = await this.python.ingestKnowledge({
      only: dto.only ?? null,
      dry_run: dto.dryRun ?? false,
    });
    if (!result) {
      throw new ServiceUnavailableException(
        'Ingestion service unavailable — try again',
      );
    }
    return result;
  }
}
