/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AdminService } from './admin.service';

function buildSupabase() {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest
    .fn()
    .mockResolvedValue({ data: { ok: 1 }, error: null });
  // .select('*') on list resolves directly (no maybeSingle)
  const fromClient = { from: jest.fn().mockReturnValue(chain) };
  return {
    chain,
    service: { getClient: jest.fn().mockReturnValue(fromClient) },
  };
}

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

describe('AdminService', () => {
  let supabase: ReturnType<typeof buildSupabase>;
  let python: { ingestKnowledge: jest.Mock };
  let service: AdminService;

  beforeEach(() => {
    supabase = buildSupabase();
    python = { ingestKnowledge: jest.fn() };
    service = new AdminService(supabase.service as any, python as any, logger);
  });

  it('rejects an unknown resource slug', async () => {
    await expect(service.list('not-a-table')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.upsert('not-a-table', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('stamps verified_at on writes to verifiable tables', async () => {
    await service.upsert('offices', { city: 'Bonn', bundesland: 'DE-NW' });
    const payload = supabase.chain.upsert.mock.calls[0][0];
    expect(payload.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(supabase.chain.upsert.mock.calls[0][1]).toEqual({
      onConflict: 'id',
    });
  });

  it('does NOT stamp verified_at on tables without that column', async () => {
    await service.upsert('requirement-tags', {
      tag: 'passport',
      label_en: 'P',
    });
    const payload = supabase.chain.upsert.mock.calls[0][0];
    expect(payload.verified_at).toBeUndefined();
  });

  it('rejects an invalid Bundesland before hitting the DB', async () => {
    await expect(
      service.upsert('offices', { city: 'X', bundesland: 'DE-ZZ' }),
    ).rejects.toThrow(BadRequestException);
    expect(supabase.chain.upsert).not.toHaveBeenCalled();
  });

  it('rejects an invalid Bundesland inside an array column', async () => {
    await expect(
      service.upsert('roadmap-steps', {
        slug: 's',
        bundeslaender: ['DE-BY', 'DE-XX'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deletes by the resource natural key', async () => {
    await service.remove('housing-parameters', 'student_funds_per_year');
    expect(supabase.chain.eq).toHaveBeenCalledWith(
      'key',
      'student_funds_per_year',
    );
  });

  it('proxies ingestion with snake_case payload', async () => {
    python.ingestKnowledge.mockResolvedValue({ total_chunks: 5 });
    const res = await service.ingest({ only: ['bamf'], dryRun: true });
    expect(python.ingestKnowledge).toHaveBeenCalledWith({
      only: ['bamf'],
      dry_run: true,
    });
    expect(res).toEqual({ total_chunks: 5 });
  });

  it('throws ServiceUnavailable when ingestion proxy returns null', async () => {
    python.ingestKnowledge.mockResolvedValue(null);
    await expect(service.ingest({})).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
