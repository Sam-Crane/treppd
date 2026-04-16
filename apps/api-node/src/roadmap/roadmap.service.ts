/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PythonService } from './python.service';

interface DbStep {
  slug: string;
  title_en: string;
  office_type?: string;
  can_do_online: boolean;
  typical_wait_days?: number;
  depends_on?: string[];
  bundeslaender?: string[];
  document_requirements?: Record<string, unknown>[];
}

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly pythonService: PythonService,
  ) {}

  async getActiveRoadmap(userId: string) {
    const { data: roadmap } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!roadmap) {
      return this.generateRoadmap(userId);
    }

    return roadmap as Record<string, unknown>;
  }

  async generateRoadmap(userId: string) {
    const { data: profile, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new NotFoundException(
        'Profile not found. Complete onboarding first.',
      );
    }

    const typedProfile = profile as Record<string, unknown>;

    // Try Python service for AI-enriched roadmap
    const enrichedRoadmap = await this.pythonService.generateRoadmap({
      ...typedProfile,
      user_id: userId,
    });

    if (enrichedRoadmap) {
      return enrichedRoadmap;
    }

    // FALLBACK: Python unavailable — serve raw DB steps
    this.logger.warn(`Falling back to raw DB steps for user ${userId}`);
    return this.fallbackRoadmap(userId, typedProfile);
  }

  private async fallbackRoadmap(
    userId: string,
    profile: Record<string, unknown>,
  ) {
    const { data: steps } = await this.supabase
      .getClient()
      .from('roadmap_steps')
      .select('*, document_requirements(*)')
      .contains('visa_types', [profile.visa_type as string])
      .order('sequence');

    const typedSteps = (steps ?? []) as DbStep[];

    const filtered = typedSteps.filter(
      (s) =>
        !s.bundeslaender?.length ||
        s.bundeslaender.includes(profile.bundesland as string),
    );

    const roadmapSteps = filtered.map((s) => ({
      slug: s.slug,
      title: s.title_en,
      explanation: '',
      office: s.office_type ?? '',
      can_do_online: s.can_do_online,
      estimated_days: s.typical_wait_days ?? 0,
      depends_on: s.depends_on ?? [],
      documents_needed: s.document_requirements ?? [],
      tips: [],
      deadline: null,
      ai_suggested: false,
      source_verified: true,
    }));

    // Persist fallback roadmap
    await this.supabase
      .getClient()
      .from('user_roadmaps')
      .upsert({
        user_id: userId,
        profile_snapshot: profile,
        steps: roadmapSteps,
        base_steps_used: filtered.map((s) => s.slug),
        ai_enriched: false,
        ai_fallback: true,
      });

    return {
      steps: roadmapSteps,
      ai_enriched: false,
      ai_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  async setStepCompletion(userId: string, slug: string, completed: boolean) {
    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('completed_steps')
      .eq('user_id', userId)
      .single();

    const existing = (profile as Record<string, unknown> | null)
      ?.completed_steps;
    const completedArr = Array.isArray(existing) ? (existing as string[]) : [];

    let nextCompleted: string[];
    if (completed) {
      nextCompleted = [...new Set([...completedArr, slug])];
    } else {
      nextCompleted = completedArr.filter((s) => s !== slug);
    }

    await this.supabase
      .getClient()
      .from('user_profiles')
      .update({ completed_steps: nextCompleted })
      .eq('user_id', userId);

    return this.getProgress(userId);
  }

  /** @deprecated Use setStepCompletion. Retained for backwards-compatible tests. */
  async completeStep(userId: string, slug: string) {
    return this.setStepCompletion(userId, slug, true);
  }

  async getProgress(userId: string) {
    const { data: roadmap } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('steps')
      .eq('user_id', userId)
      .single();

    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('completed_steps')
      .eq('user_id', userId)
      .single();

    const roadmapData = roadmap as Record<string, unknown> | null;
    const profileData = profile as Record<string, unknown> | null;

    const totalSteps = Array.isArray(roadmapData?.steps)
      ? roadmapData.steps.length
      : 0;
    const completedCount = Array.isArray(profileData?.completed_steps)
      ? profileData.completed_steps.length
      : 0;
    const percentage =
      totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    return {
      total_steps: totalSteps,
      completed: completedCount,
      percentage,
    };
  }
}
