/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { ServiceUnavailableException } from '@nestjs/common';
import { ProvidersService } from './providers.service';

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

function buildSupabase(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.contains = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn();
  // two chained .order() calls; the last resolves
  chain.order
    .mockReturnValueOnce(chain)
    .mockReturnValueOnce(Promise.resolve(result) as never);
  return {
    chain,
    service: {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue(chain),
      }),
    },
  };
}

describe('ProvidersService.listForStep', () => {
  it('filters by relevant_step_slugs and returns rows', async () => {
    const supabase = buildSupabase({
      data: [{ id: '1', category: 'banking', name: 'N26' }],
      error: null,
    });
    const svc = new ProvidersService(supabase.service as any, logger);
    const res = await svc.listForStep('bank_account');
    expect(res).toHaveLength(1);
    expect(supabase.chain.contains).toHaveBeenCalledWith(
      'relevant_step_slugs',
      ['bank_account'],
    );
  });

  it('throws ServiceUnavailable on query error', async () => {
    const supabase = buildSupabase({ data: null, error: { message: 'boom' } });
    const svc = new ProvidersService(supabase.service as any, logger);
    await expect(svc.listForStep('x')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
