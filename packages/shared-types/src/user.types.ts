export type VisaType =
  | 'student'
  | 'work'
  | 'job_seeker'
  | 'family'
  | 'freelance'
  | 'au_pair';

export type Goal =
  | 'initial_setup'
  | 'visa_renewal'
  | 'change_visa'
  | 'family_reunion'
  | 'job_change';

export type SubscriptionTier = 'free' | 'premium' | 'b2b_managed';

export interface UserProfile {
  id: string;
  user_id: string;
  nationality: string;
  visa_type: VisaType;
  bundesland: string;
  city?: string;
  goal: Goal;
  arrival_date?: string;
  visa_expiry_date?: string;
  employer_name?: string;
  university_name?: string;
  completed_steps: string[];
  updated_at: string;
}

export interface UserRoadmap {
  id: string;
  user_id: string;
  profile_snapshot: UserProfile;
  steps: import('./roadmap.types').RoadmapStep[];
  base_steps_used: string[];
  ai_enriched: boolean;
  ai_added_steps: import('./roadmap.types').RoadmapStep[];
  ai_fallback: boolean;
  generated_at: string;
  expires_at: string;
}
