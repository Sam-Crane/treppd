import { api } from './api';

export interface ServiceProvider {
  id: string;
  category: string;
  name: string;
  url: string;
  logo_url: string | null;
  description_en: string | null;
  is_affiliate: boolean;
  affiliate_url: string | null;
  sort_order: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  health_insurance: 'Health insurance',
  blocked_account: 'Blocked account (Sperrkonto)',
  banking: 'Banking',
  housing: 'Housing',
  jobs: 'Jobs',
  language_school: 'Language schools',
};

export const providersApi = {
  forStep: (stepSlug: string) =>
    api.get<ServiceProvider[]>(
      `/providers?step=${encodeURIComponent(stepSlug)}`,
    ),
};
