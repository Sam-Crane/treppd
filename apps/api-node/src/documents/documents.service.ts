/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getChecklist(userId: string) {
    // Get user's active roadmap
    const { data: roadmap, error: roadmapError } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('steps')
      .eq('user_id', userId)
      .single();

    if (roadmapError || !roadmap) {
      throw new NotFoundException(
        'No active roadmap found. Generate a roadmap first.',
      );
    }

    const steps = roadmap.steps as Array<{ slug: string; title: string }>;
    const stepSlugs = steps.map((s) => s.slug);

    // Fetch document requirements for all steps
    const { data: documents } = await this.supabase
      .getClient()
      .from('document_requirements')
      .select('*')
      .in('step_slug', stepSlugs);

    // Group by step
    const grouped = steps.map((step) => ({
      step_slug: step.slug,
      step_title: step.title,
      documents: (documents ?? []).filter(
        (d: Record<string, unknown>) => d.step_slug === step.slug,
      ),
    }));

    return grouped;
  }

  async getChecklistByStep(userId: string, stepSlug: string) {
    // Verify user has an active roadmap containing this step
    const { data: roadmap } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('steps')
      .eq('user_id', userId)
      .single();

    if (!roadmap) {
      throw new NotFoundException('No active roadmap found.');
    }

    const steps = roadmap.steps as Array<{ slug: string; title: string }>;
    const step = steps.find((s) => s.slug === stepSlug);

    if (!step) {
      throw new NotFoundException(`Step "${stepSlug}" not found in roadmap.`);
    }

    const { data: documents } = await this.supabase
      .getClient()
      .from('document_requirements')
      .select('*')
      .eq('step_slug', stepSlug);

    return {
      step_slug: step.slug,
      step_title: step.title,
      documents: documents ?? [],
    };
  }
}
