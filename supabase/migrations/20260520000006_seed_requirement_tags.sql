-- Seed: canonical requirement tags + backfill join (Phase 4 — WS2)
--
-- Tag vocabulary from the team's "Standard Requirement Tags" research doc.
-- The join is backfilled by pattern-matching the existing ~50
-- document_requirements rows (seeded in 20260320000005) against each tag —
-- robust to row UUIDs, idempotent via ON CONFLICT.

INSERT INTO public.requirement_tags (tag, label_en, label_de, description_en) VALUES
  ('passport',                'Passport',                       'Reisepass',                       'Valid national passport or recognised travel document.'),
  ('biometric_photo',         'Biometric photo',                'Biometrisches Lichtbild',         'Recent biometric passport photo meeting German specifications.'),
  ('health_insurance',        'Health insurance',               'Krankenversicherung',             'Proof of statutory or private health insurance coverage.'),
  ('proof_of_income',         'Proof of income / funds',        'Finanzierungsnachweis',           'Evidence of sufficient funds: bank statement, scholarship, salary, or sponsorship.'),
  ('proof_of_accommodation',  'Proof of accommodation',         'Wohnungsnachweis',                'Rental contract, sublease, or landlord confirmation of residence.'),
  ('employment_contract',     'Employment contract',            'Arbeitsvertrag',                  'Signed employment contract or binding job offer.'),
  ('university_admission',    'University admission / enrolment','Zulassung / Immatrikulation',     'Admission letter or enrolment certificate from a recognised institution.'),
  ('blocked_account',         'Blocked account (Sperrkonto)',   'Sperrkonto',                      'Blocked bank account holding the required annual living costs.'),
  ('language_certificate',    'Language certificate',           'Sprachzertifikat',                'Proof of German (or required) language proficiency.'),
  ('qualification_recognition','Qualification recognition',     'Anerkennung der Qualifikation',   'Recognition / equivalence certificate for a foreign professional or academic qualification.')
ON CONFLICT (tag) DO NOTHING;

-- Backfill the join by matching document names to tags.
INSERT INTO public.document_requirement_tags (requirement_id, tag)
SELECT dr.id, t.tag
FROM public.document_requirements dr
JOIN (
  VALUES
    ('passport',               ARRAY['%passport%', '%national id%']),
    ('biometric_photo',        ARRAY['%photo%', '%lichtbild%', '%biometric%']),
    ('health_insurance',       ARRAY['%health insurance%', '%krankenversicherung%', '%versicherungsbestaetigung%', '%statutory%', '%private insurance%']),
    ('proof_of_income',        ARRAY['%bank statement%', '%scholarship%', '%proof of income%', '%financial%', '%salary%', '%sperrkonto balance%', '%verpflichtungserklaerung%']),
    ('proof_of_accommodation', ARRAY['%rental%', '%landlord%', '%accommodation%', '%sublease%']),
    ('employment_contract',    ARRAY['%employment contract%', '%arbeitsvertrag%']),
    ('university_admission',   ARRAY['%admission%', '%enrol%', '%immatrikulation%', '%zulassungsbescheid%']),
    ('blocked_account',        ARRAY['%sperrkonto%', '%blocked account%']),
    ('language_certificate',   ARRAY['%language certificate%', '%sprachzertifikat%']),
    ('qualification_recognition', ARRAY['%equivalence%', '%recognition of%', '%anerkennung%', '%qualification certificate%'])
) AS t(tag, patterns) ON dr.document_name_en ILIKE ANY (t.patterns)
ON CONFLICT (requirement_id, tag) DO NOTHING;
