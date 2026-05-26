/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { FormsService } from './forms.service';

const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

const FORM = {
  id: 'f1',
  form_code: 'anmeldung_de_by',
  name_de: 'Anmeldung',
  name_en: 'Address Registration (Bavaria)',
  bundeslaender: ['DE-BY'],
  visa_types: ['student'],
  related_step_slug: 'anmeldung',
  download_url: null,
  verified_at: '2026-04-16',
  fields: [
    {
      field_id: 'last_name',
      label_en: 'Last name',
      label_de: 'Familienname',
      input_type: 'text',
      instructions_en: '',
      common_mistakes: [],
      example_value: '',
      required: true,
      ai_can_explain: false,
    },
    {
      field_id: 'first_names',
      label_en: 'First names',
      label_de: 'Vornamen',
      input_type: 'text',
      instructions_en: '',
      common_mistakes: [],
      example_value: '',
      required: true,
      ai_can_explain: false,
    },
    {
      field_id: 'nationality',
      label_en: 'Nationality',
      label_de: 'Staatsangehörigkeit',
      input_type: 'text',
      instructions_en: '',
      common_mistakes: [],
      example_value: '',
      required: true,
      ai_can_explain: false,
    },
    {
      field_id: 'move_in_date',
      label_en: 'Move-in date',
      label_de: 'Einzugsdatum',
      input_type: 'date',
      instructions_en: '',
      common_mistakes: [],
      example_value: '',
      required: true,
      ai_can_explain: false,
    },
    {
      field_id: 'religion',
      label_en: 'Religion',
      label_de: 'Religion',
      input_type: 'text',
      instructions_en: '',
      common_mistakes: [],
      example_value: '',
      required: false,
      ai_can_explain: false,
    },
  ],
};

const PROFILE = {
  user_id: 'u1',
  visa_type: 'student',
  bundesland: 'DE-BY',
  nationality: 'Nigerian',
  arrival_date: '2026-04-10',
  city: 'Munich',
};

/**
 * Build a Supabase mock whose .maybeSingle() resolves the given sequence,
 * matching the call order inside autofill:
 *   profile, form, profile, users(names), session
 */
function buildService(seq: any[], python: any = {}) {
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  let i = 0;
  chain.maybeSingle = jest.fn(() => Promise.resolve(seq[i++]));
  const supabase = {
    getClient: () => ({ from: () => chain }),
  };
  return new FormsService(supabase as any, python, logger);
}

describe('FormsService.autofill', () => {
  it('fills name, nationality and date fields from profile/user', async () => {
    const svc = buildService([
      { data: PROFILE, error: null }, // getByCode → profile
      { data: FORM, error: null }, // getByCode → form
      { data: PROFILE, error: null }, // autofill → profile
      { data: { first_name: 'Ada', last_name: 'Obi' }, error: null }, // names
      { data: null, error: null }, // session (none)
    ]);

    const res = await svc.autofill('u1', 'anmeldung_de_by');
    expect(res.values.last_name).toBe('Obi');
    expect(res.values.first_names).toBe('Ada');
    expect(res.values.nationality).toBe('Nigerian');
    expect(res.values.move_in_date).toBe('2026-04-10');
    expect(res.autofilled).toEqual(
      expect.arrayContaining([
        'last_name',
        'first_names',
        'nationality',
        'move_in_date',
      ]),
    );
    // religion is optional and underivable → not in needs_input
    expect(res.needs_input).not.toContain('religion');
  });

  it('prefers saved session values over derived ones', async () => {
    const svc = buildService([
      { data: PROFILE, error: null },
      { data: FORM, error: null },
      { data: PROFILE, error: null },
      { data: { first_name: 'Ada', last_name: 'Obi' }, error: null },
      { data: { values: { nationality: 'German' } }, error: null }, // session
    ]);

    const res = await svc.autofill('u1', 'anmeldung_de_by');
    expect(res.values.nationality).toBe('German'); // session wins
  });
});

describe('FormsService.generatePdf', () => {
  it('maps fields and proxies to Python', async () => {
    const python = {
      generatePdf: jest
        .fn()
        .mockResolvedValue({ pdf_base64: 'QQ==', filename: 'treppd-x.pdf' }),
    };
    // getByCode(2) + autofill(getByCode 2, profile, names, session) = 7
    const svc = buildService(
      [
        { data: PROFILE, error: null },
        { data: FORM, error: null },
        { data: PROFILE, error: null },
        { data: FORM, error: null },
        { data: PROFILE, error: null },
        { data: { first_name: 'Ada', last_name: 'Obi' }, error: null },
        { data: null, error: null },
      ],
      python,
    );

    const res = await svc.generatePdf('u1', 'anmeldung_de_by');
    expect(res.pdf_base64).toBe('QQ==');
    const payload = python.generatePdf.mock.calls[0][0];
    expect(payload.form_name).toBe('Address Registration (Bavaria)');
    expect(payload.fields).toEqual(
      expect.arrayContaining([{ label: 'Last name', value: 'Obi' }]),
    );
  });
});
