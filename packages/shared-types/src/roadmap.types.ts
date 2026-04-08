export interface RoadmapStep {
  slug: string;
  title: string;
  explanation: string;
  office: string;
  can_do_online: boolean;
  estimated_days: number;
  depends_on: string[];
  documents_needed: DocumentRequirement[];
  tips: string[];
  deadline: string | null;
  ai_suggested: boolean;
  source_verified: boolean;
}

export interface DocumentRequirement {
  document_name_en: string;
  document_name_de: string;
  specifications: Record<string, unknown>;
  needs_certified_copy: boolean;
  needs_translation: boolean;
  needs_apostille: boolean;
  where_to_get: string;
  estimated_cost_eur: number | null;
}

export interface FormField {
  field_id: string;
  label_de: string;
  label_en: string;
  input_type: 'text' | 'date' | 'checkbox' | 'select' | 'number';
  instructions_en: string;
  common_mistakes: string[];
  example_value: string;
  required: boolean;
  ai_can_explain: boolean;
}

export interface Form {
  id: string;
  form_code: string;
  name_de: string;
  name_en: string;
  bundeslaender: string[];
  visa_types: string[];
  related_step_slug: string;
  fields: FormField[];
  download_url?: string;
  verified_at: string;
}

export interface RoadmapProgress {
  total_steps: number;
  completed: number;
  percentage: number;
  next_deadline?: string;
}
