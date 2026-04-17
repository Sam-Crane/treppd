/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method, @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { FormsService } from './forms.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';

/**
 * Supabase chains are nested and method-based; these helpers make the
 * mocks read less like noise than a single large spy.
 */
function buildSelectChain(
  result: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('FormsService', () => {
  let service: FormsService;
  let pythonService: PythonService;
  let logger: Logger;

  const mockProfile = {
    user_id: 'user-123',
    visa_type: 'student',
    bundesland: 'DE-BY',
    nationality: 'NG',
    goal: 'initial_setup',
  };

  const mockForm = {
    id: 'form-uuid-1',
    form_code: 'anmeldung_de_by',
    name_de: 'Wohnsitzanmeldung (Bayern)',
    name_en: 'Address Registration (Bavaria)',
    bundeslaender: ['DE-BY'],
    visa_types: ['student', 'work'],
    related_step_slug: 'anmeldung',
    download_url: 'https://stadt.muenchen.de/...',
    verified_at: '2026-04-16',
    fields: [
      {
        field_id: 'last_name',
        label_en: 'Last name',
        label_de: 'Familienname',
        input_type: 'text',
        instructions_en: 'Exactly as on your passport.',
        common_mistakes: ['typos'],
        example_value: 'Müller',
        required: true,
        ai_can_explain: false,
      },
    ],
  };

  const mockBerlinForm = {
    ...mockForm,
    id: 'form-uuid-2',
    form_code: 'anmeldung_de_be',
    bundeslaender: ['DE-BE'],
  };

  let supabaseChain: ReturnType<typeof buildSelectChain>;
  let supabaseService: { getClient: jest.Mock };

  beforeEach(async () => {
    supabaseChain = buildSelectChain();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue(supabaseChain),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: SupabaseService, useValue: supabaseService },
        {
          provide: PythonService,
          useValue: {
            explainField: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(FormsService);
    pythonService = module.get(PythonService);
    logger = module.get(Logger);
  });

  // -------------------------------------------------------------- listForUser

  describe('listForUser', () => {
    it('filters forms by user visa and Bundesland', async () => {
      // First call: profile lookup
      // Second call: forms SELECT (returns array via ordinary then)
      supabaseChain.maybeSingle.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      // For the second call supabase returns a raw array without maybeSingle;
      // override `.select()` on a fresh chain to resolve directly.
      const formsChain = {
        select: jest
          .fn()
          .mockResolvedValue({ data: [mockForm, mockBerlinForm], error: null }),
      };
      (supabaseService.getClient() as { from: jest.Mock }).from = jest
        .fn()
        .mockReturnValueOnce(supabaseChain) // profile lookup
        .mockReturnValueOnce(formsChain); // forms lookup

      // Re-seed the profile resolution on the first chain
      supabaseChain.maybeSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await service.listForUser('user-123');
      expect(result).toHaveLength(1);
      expect(result[0].form_code).toBe('anmeldung_de_by');
      expect(result[0].field_count).toBe(1);
    });

    it('throws NotFoundException when profile is missing', async () => {
      supabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(service.listForUser('user-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------- getByCode

  describe('getByCode', () => {
    it('returns full form including fields for an applicable user', async () => {
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockForm, error: null });

      const result = await service.getByCode('user-123', 'anmeldung_de_by');
      expect(result.form_code).toBe('anmeldung_de_by');
      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].field_id).toBe('last_name');
    });

    it('returns 404 when form is not applicable to the user (Bundesland mismatch)', async () => {
      // User is Bavaria; we serve the Berlin form
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockBerlinForm, error: null });

      await expect(
        service.getByCode('user-123', 'anmeldung_de_be'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns 404 when form code is unknown', async () => {
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      await expect(
        service.getByCode('user-123', 'no_such_form'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------- explainField

  describe('explainField', () => {
    it('proxies to PythonService with the right user context', async () => {
      // Two getUserProfile calls expected: one direct, one via getByCode.
      // Then getByCode triggers another form fetch.
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null }) // profile
        .mockResolvedValueOnce({ data: mockProfile, error: null }) // profile from getByCode
        .mockResolvedValueOnce({ data: mockForm, error: null }); // form lookup

      (pythonService.explainField as jest.Mock).mockResolvedValue({
        explanation: 'Enter your last name.',
        tips: ['No typos'],
        example: 'Müller',
      });

      const result = await service.explainField(
        'user-123',
        'anmeldung_de_by',
        'last_name',
      );
      expect(pythonService.explainField).toHaveBeenCalledWith({
        form_code: 'anmeldung_de_by',
        field_id: 'last_name',
        user_context: expect.objectContaining({
          visa_type: 'student',
          bundesland: 'DE-BY',
        }),
      });
      expect(result.explanation).toBe('Enter your last name.');
    });

    it('throws ServiceUnavailable when Python service returns null', async () => {
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockForm, error: null });

      (pythonService.explainField as jest.Mock).mockResolvedValue(null);

      await expect(
        service.explainField('user-123', 'anmeldung_de_by', 'last_name'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -------------------------------------------------------------- saveSession

  describe('saveSession', () => {
    it('rejects oversized payloads', async () => {
      const tooMany = Object.fromEntries(
        Array.from({ length: 200 }, (_, i) => [`f${i}`, 'value']),
      );
      await expect(
        service.saveSession('user-123', 'anmeldung_de_by', tooMany),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects overly long values', async () => {
      const values = { last_name: 'x'.repeat(2000) };
      await expect(
        service.saveSession('user-123', 'anmeldung_de_by', values),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts a valid payload', async () => {
      // getByCode: profile then form
      supabaseChain.maybeSingle
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockForm, error: null })
        // final upsert → select → maybeSingle
        .mockResolvedValueOnce({
          data: { updated_at: '2026-04-16T12:00:00Z' },
          error: null,
        });

      const result = await service.saveSession('user-123', 'anmeldung_de_by', {
        last_name: 'Müller',
      });
      expect(result.ok).toBe(true);
      expect(supabaseChain.upsert).toHaveBeenCalled();
    });
  });
});
