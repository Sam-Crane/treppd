/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppointmentsService } from './appointments.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from '../roadmap/python.service';

function buildSupabaseChain(
  result: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let pythonService: PythonService;
  let chain: ReturnType<typeof buildSupabaseChain>;
  let supabaseService: { getClient: jest.Mock };

  const mockProfile = {
    user_id: 'user-123',
    visa_type: 'student',
    bundesland: 'DE-BY',
    nationality: 'Nigerian',
    goal: 'initial_setup',
    full_name: 'Anna Müller',
    applicant_email: 'anna@example.com',
  };

  beforeEach(async () => {
    chain = buildSupabaseChain({ data: mockProfile, error: null });
    supabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue(chain),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: SupabaseService, useValue: supabaseService },
        {
          provide: PythonService,
          useValue: {
            appointmentEmail: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: { warn: jest.fn(), error: jest.fn(), log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AppointmentsService);
    pythonService = module.get(PythonService);
  });

  it('calls PythonService with enriched user_profile + office_details', async () => {
    (pythonService.appointmentEmail as jest.Mock).mockResolvedValue({
      subject: 'Terminanfrage — Erstausstellung Aufenthaltstitel',
      body: 'Sehr geehrte Damen und Herren, ...',
    });

    const result = await service.generate('user-123', {
      process_type: 'aufenthaltstitel',
      office_details: {
        name: 'KVR München',
        email: 'auslaenderbehoerde@muenchen.de',
        requested_dates: ['2026-05-10', '2026-05-12'],
      },
    });

    expect(pythonService.appointmentEmail).toHaveBeenCalledTimes(1);
    const call = (pythonService.appointmentEmail as jest.Mock).mock.calls[0][0];
    expect(call.process_type).toBe('aufenthaltstitel');
    expect(call.user_profile.visa_type).toBe('student');
    expect(call.user_profile.bundesland).toBe('DE-BY');
    expect(call.user_profile.full_name).toBe('Anna Müller');
    expect(call.office_details.name).toBe('KVR München');
    expect(call.office_details.requested_dates).toEqual([
      '2026-05-10',
      '2026-05-12',
    ]);

    expect(result.subject).toContain('Terminanfrage');
    expect(result.body).toContain('Sehr geehrte');
  });

  it('throws NotFoundException when profile is missing', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(
      service.generate('user-unknown', {
        process_type: 'aufenthaltstitel',
        office_details: { name: 'X', email: 'x@y.de' },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ServiceUnavailable when Python returns null', async () => {
    (pythonService.appointmentEmail as jest.Mock).mockResolvedValue(null);
    await expect(
      service.generate('user-123', {
        process_type: 'aufenthaltstitel',
        office_details: { name: 'X', email: 'x@y.de' },
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('passes empty arrays for requested_dates when not provided', async () => {
    (pythonService.appointmentEmail as jest.Mock).mockResolvedValue({
      subject: 'S',
      body: 'B',
    });

    await service.generate('user-123', {
      process_type: 'anmeldung',
      office_details: { name: 'X', email: 'x@y.de' },
    });

    const call = (pythonService.appointmentEmail as jest.Mock).mock.calls[0][0];
    expect(call.office_details.requested_dates).toEqual([]);
  });
});
