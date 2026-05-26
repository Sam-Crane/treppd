-- Seed: initial service providers (Phase 5)
--
-- Official URLs verified 2026-05-26. Logos intentionally left NULL — an admin
-- uploads them via the portal (avoids bundling brand images of uncertain
-- licence). Shown as neutral options; none are affiliate links yet.
-- relevant_step_slugs uses the verified roadmap step slugs from
-- 20260320000005_seed_roadmap_steps.sql.

INSERT INTO public.service_providers
  (category, name, url, description_en, relevant_step_slugs, sort_order, source_url, verified_at)
VALUES
  -- Blocked account (Sperrkonto) → sperrkonto_activation
  ('blocked_account', 'Fintiba', 'https://www.fintiba.com',
    'Blocked account + health insurance bundle popular with students.',
    ARRAY['sperrkonto_activation'], 1, 'https://www.fintiba.com', '2026-05-26'),
  ('blocked_account', 'Expatrio', 'https://www.expatrio.com',
    'Blocked account and insurance package for international students.',
    ARRAY['sperrkonto_activation'], 2, 'https://www.expatrio.com', '2026-05-26'),
  ('blocked_account', 'Coracle', 'https://coracle.de',
    'Blocked account and visa-related financial services.',
    ARRAY['sperrkonto_activation'], 3, 'https://coracle.de', '2026-05-26'),

  -- Health insurance → health_insurance
  ('health_insurance', 'Techniker Krankenkasse (TK)', 'https://www.tk.de',
    'Major statutory health insurer; common choice for students and employees.',
    ARRAY['health_insurance'], 1, 'https://www.tk.de', '2026-05-26'),
  ('health_insurance', 'MAWISTA', 'https://www.mawista.com',
    'Private health insurance for students, language students and visitors.',
    ARRAY['health_insurance'], 2, 'https://www.mawista.com', '2026-05-26'),
  ('health_insurance', 'DR-WALTER', 'https://www.dr-walter.com',
    'Private and incoming health insurance for internationals.',
    ARRAY['health_insurance'], 3, 'https://www.dr-walter.com', '2026-05-26'),

  -- Banking → bank_account
  ('banking', 'N26', 'https://n26.com',
    'Digital bank with English app; quick online account opening.',
    ARRAY['bank_account'], 1, 'https://n26.com', '2026-05-26'),
  ('banking', 'Deutsche Bank', 'https://www.deutsche-bank.de',
    'Traditional bank with branch network and student accounts.',
    ARRAY['bank_account'], 2, 'https://www.deutsche-bank.de', '2026-05-26'),
  ('banking', 'Commerzbank', 'https://www.commerzbank.de',
    'Traditional bank offering free accounts for students/newcomers.',
    ARRAY['bank_account'], 3, 'https://www.commerzbank.de', '2026-05-26'),

  -- Housing → anmeldung (find a place before/around address registration)
  ('housing', 'ImmoScout24', 'https://www.immobilienscout24.de',
    'Germany''s largest property listing portal (rentals and sales).',
    ARRAY['anmeldung'], 1, 'https://www.immobilienscout24.de', '2026-05-26'),
  ('housing', 'WG-Gesucht', 'https://www.wg-gesucht.de',
    'Shared flats (WG) and rentals; popular with students.',
    ARRAY['anmeldung'], 2, 'https://www.wg-gesucht.de', '2026-05-26'),
  ('housing', 'Wunderflats', 'https://wunderflats.com',
    'Furnished mid-term rentals with registration-ready contracts.',
    ARRAY['anmeldung'], 3, 'https://wunderflats.com', '2026-05-26'),

  -- Jobs → residence permit (work context)
  ('jobs', 'StepStone', 'https://www.stepstone.de',
    'Major German job board across industries.',
    ARRAY['residence_permit_by','residence_permit_be','residence_permit_nw'], 1,
    'https://www.stepstone.de', '2026-05-26'),
  ('jobs', 'Make it in Germany — Jobs', 'https://www.make-it-in-germany.com/en/looking-for-foreign-professionals/jobs',
    'Official portal listing jobs for skilled foreign professionals.',
    ARRAY['residence_permit_by','residence_permit_be','residence_permit_nw'], 2,
    'https://www.make-it-in-germany.com', '2026-05-26'),
  ('jobs', 'LinkedIn Jobs', 'https://www.linkedin.com/jobs',
    'Professional network with English-language job listings in Germany.',
    ARRAY['residence_permit_by','residence_permit_be','residence_permit_nw'], 3,
    'https://www.linkedin.com/jobs', '2026-05-26'),

  -- Language schools → university_enrollment
  ('language_school', 'Goethe-Institut', 'https://www.goethe.de',
    'Official German language courses and certificates worldwide.',
    ARRAY['university_enrollment'], 1, 'https://www.goethe.de', '2026-05-26'),
  ('language_school', 'DW Learn German', 'https://learngerman.dw.com',
    'Free German learning resources from Deutsche Welle.',
    ARRAY['university_enrollment'], 2, 'https://learngerman.dw.com', '2026-05-26');
