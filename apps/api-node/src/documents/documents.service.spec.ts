/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { DocumentsService } from './documents.service';

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

/**
 * getCompleteness issues four sequential queries:
 *   1) user_roadmaps.select(steps).eq.single
 *   2) user_profiles.select.eq.maybeSingle
 *   3) document_requirements.select.in   (resolves array)
 *   4) user_documents.select.eq          (resolves array)
 * We hand each `from()` call its own thenable chain in order.
 */
function makeChain(
  final: any,
  terminal: 'single' | 'maybeSingle' | 'in' | 'eq',
) {
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue(final);
  chain.maybeSingle = jest.fn().mockResolvedValue(final);
  // For terminal '.in' / '.eq' the awaited value is the chain itself resolving.
  if (terminal === 'in') chain.in = jest.fn().mockResolvedValue(final);
  if (terminal === 'eq') chain.eq = jest.fn().mockResolvedValue(final);
  return chain;
}

function buildService(opts: {
  roadmap: any;
  profile: any;
  requirements: any[];
  uploads: any[];
  python: any;
}) {
  const chains = [
    makeChain({ data: opts.roadmap, error: null }, 'single'),
    makeChain({ data: opts.profile, error: null }, 'maybeSingle'),
    makeChain({ data: opts.requirements, error: null }, 'in'),
    makeChain({ data: opts.uploads, error: null }, 'eq'),
  ];
  let call = 0;
  const supabase = {
    getClient: () => ({ from: () => chains[call++] }),
  };
  return new DocumentsService(supabase as any, logger, opts.python);
}

describe('DocumentsService.getCompleteness', () => {
  const reqPassport = {
    step_slug: 'anmeldung',
    document_name_en: 'Passport',
    needs_translation: false,
    needs_apostille: false,
    needs_certified_copy: false,
    document_requirement_tags: [{ tag: 'passport' }],
  };
  const reqInsurance = {
    step_slug: 'health',
    document_name_en: 'Proof of health insurance',
    needs_translation: false,
    needs_apostille: false,
    needs_certified_copy: false,
    document_requirement_tags: [{ tag: 'health_insurance' }],
  };
  const reqDegree = {
    step_slug: 'permit',
    document_name_en: 'Degree certificate',
    needs_translation: true,
    needs_apostille: true,
    needs_certified_copy: false,
    document_requirement_tags: [{ tag: 'qualification_recognition' }],
  };

  it('marks uploaded tags satisfied and the rest missing', async () => {
    const python = {
      reviewDocuments: jest.fn().mockResolvedValue({ summary_en: 'ok' }),
    };
    const svc = buildService({
      roadmap: { steps: [{ slug: 'anmeldung' }, { slug: 'health' }] },
      profile: { visa_type: 'student', bundesland: 'DE-BY' },
      requirements: [reqPassport, reqInsurance],
      uploads: [{ step_slug: 'anmeldung', document_name_en: 'Passport' }],
      python,
    });

    const res = await svc.getCompleteness('u1');
    expect(res.satisfied).toEqual(['passport']);
    expect(res.missing).toEqual(['health_insurance']);
    expect(res.summary_en).toBe('ok');
    expect(res.fallback).toBe(false);
  });

  it('emits warnings for satisfied docs needing translation/apostille', async () => {
    const python = {
      reviewDocuments: jest.fn().mockResolvedValue({ summary_en: 's' }),
    };
    const svc = buildService({
      roadmap: { steps: [{ slug: 'permit' }] },
      profile: {},
      requirements: [reqDegree],
      uploads: [
        { step_slug: 'permit', document_name_en: 'Degree certificate' },
      ],
      python,
    });

    const res = await svc.getCompleteness('u1');
    expect(res.satisfied).toContain('qualification_recognition');
    const issues = res.warnings.map((w) => w.issue);
    expect(issues).toContain('needs_translation');
    expect(issues).toContain('needs_apostille');
  });

  it('falls back to a templated summary when Python is down', async () => {
    const python = { reviewDocuments: jest.fn().mockResolvedValue(null) };
    const svc = buildService({
      roadmap: { steps: [{ slug: 'health' }] },
      profile: {},
      requirements: [reqInsurance],
      uploads: [],
      python,
    });

    const res = await svc.getCompleteness('u1');
    expect(res.fallback).toBe(true);
    expect(res.missing).toContain('health_insurance');
    expect(res.summary_en).toContain('health_insurance');
  });
});
