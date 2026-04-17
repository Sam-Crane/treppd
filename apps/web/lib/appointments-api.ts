/**
 * Typed client for the Appointment Email Generator (Phase 3d).
 */
import { api } from './api';

export type ProcessType =
  | 'aufenthaltstitel'
  | 'verlaengerung'
  | 'familienzusammenfuehrung'
  | 'anmeldung'
  | 'eat_abholung';

export interface OfficeDetails {
  name: string;
  email: string;
  phone?: string;
  requested_dates?: string[];
}

export interface GenerateRequest {
  process_type: ProcessType;
  office_details: OfficeDetails;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export const appointmentsApi = {
  generate: (payload: GenerateRequest) =>
    api.post<GeneratedEmail>('/appointments/generate', payload),
};

/**
 * Process metadata for the frontend picker. Keys mirror
 * apps/api-python/prompts/appointment_email_prompt.py PROCESS_LABELS.
 */
export const PROCESS_OPTIONS: Array<{
  key: ProcessType;
  label_en: string;
  label_de: string;
  description: string;
  office: string;
}> = [
  {
    key: 'aufenthaltstitel',
    label_en: 'New residence permit',
    label_de: 'Erstausstellung eines Aufenthaltstitels',
    description:
      'First-time residence permit application after entering Germany on a national visa.',
    office: 'Ausländerbehörde',
  },
  {
    key: 'verlaengerung',
    label_en: 'Residence permit extension',
    label_de: 'Verlängerung des Aufenthaltstitels',
    description:
      'Extending an existing residence permit before it expires.',
    office: 'Ausländerbehörde',
  },
  {
    key: 'familienzusammenfuehrung',
    label_en: 'Family reunification',
    label_de: 'Familienzusammenführung',
    description:
      'Bringing a spouse or minor child to Germany under the family reunification route.',
    office: 'Ausländerbehörde',
  },
  {
    key: 'anmeldung',
    label_en: 'Address registration (Anmeldung)',
    label_de: 'Anmeldung eines Wohnsitzes',
    description:
      'Registering a new address with the Einwohnermeldeamt within 14 days of moving in.',
    office: 'Einwohnermeldeamt / Bürgerbüro',
  },
  {
    key: 'eat_abholung',
    label_en: 'Pick up electronic residence permit',
    label_de: 'Abholung des elektronischen Aufenthaltstitels',
    description:
      'Collecting the eAT card once it\u2019s ready at the Ausländerbehörde.',
    office: 'Ausländerbehörde',
  },
];
