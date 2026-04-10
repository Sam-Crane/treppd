import { z } from 'zod';

export const visaTypes = [
  'student',
  'work',
  'job_seeker',
  'family',
  'freelance',
  'au_pair',
] as const;

export const goals = [
  'initial_setup',
  'visa_renewal',
  'change_visa',
  'family_reunion',
  'job_change',
] as const;

export const bundeslaender = [
  { code: 'DE-BY', name: 'Bavaria (Bayern)' },
  { code: 'DE-BE', name: 'Berlin' },
  { code: 'DE-NW', name: 'North Rhine-Westphalia (NRW)' },
  { code: 'DE-BW', name: 'Baden-Wuerttemberg' },
  { code: 'DE-HE', name: 'Hesse (Hessen)' },
  { code: 'DE-HH', name: 'Hamburg' },
  { code: 'DE-NI', name: 'Lower Saxony (Niedersachsen)' },
  { code: 'DE-SN', name: 'Saxony (Sachsen)' },
  { code: 'DE-SH', name: 'Schleswig-Holstein' },
  { code: 'DE-TH', name: 'Thuringia (Thueringen)' },
  { code: 'DE-BB', name: 'Brandenburg' },
  { code: 'DE-MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'DE-RP', name: 'Rhineland-Palatinate (Rheinland-Pfalz)' },
  { code: 'DE-SL', name: 'Saarland' },
  { code: 'DE-ST', name: 'Saxony-Anhalt (Sachsen-Anhalt)' },
  { code: 'DE-HB', name: 'Bremen' },
] as const;

export const visaTypeLabels: Record<string, string> = {
  student: 'Student Visa',
  work: 'Work Permit / Employment Visa',
  job_seeker: 'Job Seeker Visa',
  family: 'Family Reunification Visa',
  freelance: 'Freelance / Self-Employment Visa',
  au_pair: 'Au Pair Visa',
};

export const goalLabels: Record<string, string> = {
  initial_setup: 'I just arrived — help me set everything up',
  visa_renewal: 'I need to renew my visa / residence permit',
  change_visa: 'I want to change my visa type',
  family_reunion: 'I am bringing family members to Germany',
  job_change: 'I am changing jobs and need to update my permit',
};

export const profileSchema = z
  .object({
    visa_type: z.enum(visaTypes),
    nationality: z.string().min(2, 'Please select your nationality').max(2),
    bundesland: z.string().min(1, 'Please select your state'),
    city: z.string().optional(),
    goal: z.enum(goals),
    arrival_date: z.string().optional(),
    visa_expiry_date: z.string().optional(),
    university_name: z.string().optional(),
    employer_name: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.visa_type === 'student' && !data.university_name) return false;
      return true;
    },
    { message: 'University name is required for student visa', path: ['university_name'] },
  )
  .refine(
    (data) => {
      if (data.visa_type === 'work' && !data.employer_name) return false;
      return true;
    },
    { message: 'Employer name is required for work visa', path: ['employer_name'] },
  );

export type ProfileFormData = z.infer<typeof profileSchema>;
