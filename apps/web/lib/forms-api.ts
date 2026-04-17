/**
 * Typed client for the Form-Filling Guide endpoints (Phase 3c).
 * All calls go through the shared `api` helper which attaches
 * the Supabase session JWT.
 */
import { api } from './api';

export type InputType = 'text' | 'date' | 'checkbox' | 'select' | 'number';

export interface FormField {
  field_id: string;
  label_de: string;
  label_en: string;
  input_type: InputType;
  instructions_en: string;
  common_mistakes: string[];
  example_value: string;
  required: boolean;
  ai_can_explain: boolean;
}

export interface FormSummary {
  id: string;
  form_code: string;
  name_de: string;
  name_en: string;
  bundeslaender: string[];
  visa_types: string[];
  related_step_slug: string | null;
  download_url: string | null;
  verified_at: string;
  field_count: number;
}

export interface FormRecord extends Omit<FormSummary, 'field_count'> {
  fields: FormField[];
}

export interface SessionResponse {
  values: Record<string, string | number | boolean>;
  updated_at: string | null;
}

export interface FieldExplanation {
  explanation: string;
  tips: string[];
  example: string;
}

export const formsApi = {
  list: () => api.get<FormSummary[]>('/forms'),

  get: (formCode: string) => api.get<FormRecord>(`/forms/${formCode}`),

  explainField: (formCode: string, fieldId: string) =>
    api.get<FieldExplanation>(`/forms/${formCode}/explain/${fieldId}`),

  getSession: (formCode: string) =>
    api.get<SessionResponse>(`/forms/${formCode}/session`),

  saveSession: (
    formCode: string,
    values: Record<string, string | number | boolean>,
  ) =>
    api.post<{ ok: true; updated_at: string }>(
      `/forms/${formCode}/session`,
      { values },
    ),

  clearSession: (formCode: string) =>
    api.delete<{ ok: true }>(`/forms/${formCode}/session`),
};
