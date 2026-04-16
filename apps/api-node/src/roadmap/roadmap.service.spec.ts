import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from './python.service';

// Mock Supabase query builder chain
function createMockQueryBuilder(
  returnData: unknown = null,
  error: unknown = null,
) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: returnData, error }),
  };
  // For chained calls without .single()
  builder.update.mockReturnValue(builder);
  return builder;
}

describe('RoadmapService', () => {
  let service: RoadmapService;
  let pythonService: PythonService;
  let mockFrom: jest.Mock;

  const mockProfile = {
    user_id: 'user-123',
    nationality: 'NG',
    visa_type: 'student',
    bundesland: 'DE-BY',
    city: 'Munich',
    goal: 'initial_setup',
    completed_steps: [],
  };

  const mockDbSteps = [
    {
      slug: 'anmeldung',
      title_en: 'Address Registration',
      office_type: 'einwohnermeldeamt',
      can_do_online: false,
      typical_wait_days: 1,
      depends_on: [],
      bundeslaender: [],
      document_requirements: [],
    },
    {
      slug: 'health_insurance',
      title_en: 'Health Insurance',
      office_type: 'insurance',
      can_do_online: true,
      typical_wait_days: 3,
      depends_on: ['anmeldung'],
      bundeslaender: [],
      document_requirements: [],
    },
  ];

  const mockEnrichedRoadmap = {
    roadmap_id: 'roadmap-456',
    steps: [
      { slug: 'anmeldung', title: 'Address Registration', ai_suggested: false },
    ],
    ai_enriched: true,
    ai_fallback: false,
  };

  const mockCachedRoadmap = {
    id: 'roadmap-cached',
    user_id: 'user-123',
    steps: [{ slug: 'anmeldung', title: 'Address Registration' }],
    ai_enriched: true,
    ai_fallback: false,
    expires_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  };

  beforeEach(async () => {
    mockFrom = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({ from: mockFrom }),
          },
        },
        {
          provide: PythonService,
          useValue: {
            generateRoadmap: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoadmapService>(RoadmapService);
    pythonService = module.get<PythonService>(PythonService);
  });

  describe('getActiveRoadmap', () => {
    it('should return cached roadmap if not expired', async () => {
      mockFrom.mockReturnValue(createMockQueryBuilder(mockCachedRoadmap));

      const result = await service.getActiveRoadmap('user-123');

      expect(result).toEqual(mockCachedRoadmap);
      expect(mockFrom).toHaveBeenCalledWith('user_roadmaps');
    });

    it('should call generateRoadmap when no cached roadmap exists', async () => {
      // First call: user_roadmaps returns null (no cache)
      // Second call: user_profiles returns profile
      // Third call: pythonService returns enriched roadmap
      const callCount = { n: 0 };
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_roadmaps' && callCount.n === 0) {
          callCount.n++;
          return createMockQueryBuilder(null);
        }
        if (table === 'user_profiles') {
          return createMockQueryBuilder(mockProfile);
        }
        return createMockQueryBuilder(null);
      });

      jest
        .spyOn(pythonService, 'generateRoadmap')
        .mockResolvedValue(mockEnrichedRoadmap);

      const result = await service.getActiveRoadmap('user-123');

      expect(result).toEqual(mockEnrichedRoadmap);
    });
  });

  describe('generateRoadmap', () => {
    it('should return AI-enriched roadmap when Python service is available', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return createMockQueryBuilder(mockProfile);
        }
        return createMockQueryBuilder(null);
      });

      jest
        .spyOn(pythonService, 'generateRoadmap')
        .mockResolvedValue(mockEnrichedRoadmap);

      const result = await service.generateRoadmap('user-123');

      expect(result).toEqual(mockEnrichedRoadmap);
      expect(result).toHaveProperty('ai_enriched', true);
    });

    it('should fall back to raw DB steps when Python returns null', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return createMockQueryBuilder(mockProfile);
        }
        if (table === 'roadmap_steps') {
          const builder = createMockQueryBuilder(null);
          // Override: order() returns the final result (not .single())
          builder.order.mockResolvedValue({ data: mockDbSteps, error: null });
          return builder;
        }
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder(null);
        }
        return createMockQueryBuilder(null);
      });

      jest.spyOn(pythonService, 'generateRoadmap').mockResolvedValue(null);

      const result = await service.generateRoadmap('user-123');

      expect(result).toHaveProperty('ai_fallback', true);
      expect(result).toHaveProperty('ai_enriched', false);
      expect(result.steps).toHaveLength(2);
    });

    it('should set ai_fallback: true on fallback response', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return createMockQueryBuilder(mockProfile);
        }
        if (table === 'roadmap_steps') {
          const builder = createMockQueryBuilder(null);
          builder.order.mockResolvedValue({ data: mockDbSteps, error: null });
          return builder;
        }
        return createMockQueryBuilder(null);
      });

      jest.spyOn(pythonService, 'generateRoadmap').mockResolvedValue(null);

      const result = await service.generateRoadmap('user-123');

      expect(result.ai_fallback).toBe(true);
      expect(result.ai_enriched).toBe(false);
    });

    it('should throw NotFoundException when user has no profile', async () => {
      mockFrom.mockReturnValue(
        createMockQueryBuilder(null, {
          code: 'PGRST116',
          message: 'not found',
        }),
      );

      await expect(service.generateRoadmap('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeStep', () => {
    it('should add slug to completed_steps array', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          const builder = createMockQueryBuilder({
            completed_steps: ['anmeldung'],
          });
          builder.update = updateMock;
          return builder;
        }
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder({
            steps: [{ slug: 'anmeldung' }, { slug: 'health_insurance' }],
          });
        }
        return createMockQueryBuilder(null);
      });

      const result = await service.completeStep('user-123', 'health_insurance');

      expect(updateMock).toHaveBeenCalledWith({
        completed_steps: ['anmeldung', 'health_insurance'],
      });
      expect(result).toHaveProperty('percentage');
    });

    it('should deduplicate already-completed slugs', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          const builder = createMockQueryBuilder({
            completed_steps: ['anmeldung'],
          });
          builder.update = updateMock;
          return builder;
        }
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder({ steps: [{ slug: 'anmeldung' }] });
        }
        return createMockQueryBuilder(null);
      });

      await service.completeStep('user-123', 'anmeldung');

      // Should not duplicate 'anmeldung'
      expect(updateMock).toHaveBeenCalledWith({
        completed_steps: ['anmeldung'],
      });
    });

    it('should remove slug from completed_steps when completed=false', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          const builder = createMockQueryBuilder({
            completed_steps: ['anmeldung', 'health_insurance'],
          });
          builder.update = updateMock;
          return builder;
        }
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder({
            steps: [{ slug: 'anmeldung' }, { slug: 'health_insurance' }],
          });
        }
        return createMockQueryBuilder(null);
      });

      await service.setStepCompletion('user-123', 'anmeldung', false);

      // 'anmeldung' should be removed, 'health_insurance' kept
      expect(updateMock).toHaveBeenCalledWith({
        completed_steps: ['health_insurance'],
      });
    });

    it('should handle uncomplete of slug not in array (idempotent)', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          const builder = createMockQueryBuilder({
            completed_steps: ['anmeldung'],
          });
          builder.update = updateMock;
          return builder;
        }
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder({ steps: [{ slug: 'anmeldung' }] });
        }
        return createMockQueryBuilder(null);
      });

      await service.setStepCompletion('user-123', 'not_in_list', false);

      expect(updateMock).toHaveBeenCalledWith({
        completed_steps: ['anmeldung'],
      });
    });
  });

  describe('getProgress', () => {
    it('should compute correct percentage', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_roadmaps') {
          return createMockQueryBuilder({
            steps: [
              { slug: 'anmeldung' },
              { slug: 'health_insurance' },
              { slug: 'bank_account' },
              { slug: 'residence_permit' },
            ],
          });
        }
        if (table === 'user_profiles') {
          return createMockQueryBuilder({
            completed_steps: ['anmeldung'],
          });
        }
        return createMockQueryBuilder(null);
      });

      const result = await service.getProgress('user-123');

      expect(result).toEqual({
        total_steps: 4,
        completed: 1,
        percentage: 25,
      });
    });
  });
});
