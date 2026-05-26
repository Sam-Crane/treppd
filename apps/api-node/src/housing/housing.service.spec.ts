/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { ServiceUnavailableException } from '@nestjs/common';
import { HousingService } from './housing.service';

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

function buildSupabase(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockResolvedValue(result);
  return {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue(chain),
    }),
    chain,
  };
}

describe('HousingService', () => {
  it('lists housing offices filtered by bundesland + city', async () => {
    const supabase = buildSupabase({
      data: [{ city: 'Düsseldorf' }],
      error: null,
    });
    const svc = new HousingService(supabase as any, {} as any, logger);
    const res = await svc.listOffices('DE-NW', 'Düsseldorf');
    expect(res).toHaveLength(1);
    expect(supabase.chain.eq).toHaveBeenCalledWith('bundesland', 'DE-NW');
    expect(supabase.chain.eq).toHaveBeenCalledWith('city', 'Düsseldorf');
  });

  it('throws ServiceUnavailable when the office query errors', async () => {
    const supabase = buildSupabase({ data: null, error: { message: 'x' } });
    const svc = new HousingService(supabase as any, {} as any, logger);
    await expect(svc.listOffices()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('returns the Python result for a WBS estimate', async () => {
    const python = {
      housingWbs: jest.fn().mockResolvedValue({ eligible: true }),
    };
    const svc = new HousingService({} as any, python as any, logger);
    const res = await svc.wbs({
      bundesland: 'DE-NW',
      household_size: 1,
      annual_net_income_eur: 18000,
    });
    expect(res.eligible).toBe(true);
  });

  it('degrades gracefully (fallback) when Python is down', async () => {
    const python = { housingWohngeld: jest.fn().mockResolvedValue(null) };
    const svc = new HousingService({} as any, python as any, logger);
    const res = await svc.wohngeld({
      bundesland: 'DE-NW',
      household_size: 1,
      monthly_net_income_eur: 1500,
      monthly_rent_eur: 600,
    });
    expect(res.fallback).toBe(true);
    expect(res.indicator).toBe('unknown');
  });
});
