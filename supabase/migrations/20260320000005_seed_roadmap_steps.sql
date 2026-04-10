-- Migration: Seed verified roadmap steps and document requirements
-- Covers: Bavaria (DE-BY), Berlin (DE-BE), NRW (DE-NW)
-- Visa types: student, work
-- Sources: make-it-in-germany.com, bamf.de, DAAD, state ABH websites

-- ============================================================================
-- ROADMAP STEPS
-- ============================================================================

-- Steps with empty bundeslaender[] apply to ALL states.
-- Steps with specific bundeslaender apply only to those states.

INSERT INTO public.roadmap_steps (slug, visa_types, bundeslaender, sequence, depends_on, title_de, title_en, office_type, can_do_online, typical_wait_days, deadline_rule, verified_at, source_url) VALUES

-- 1. Address Registration (all visa types, all states)
('anmeldung',
 ARRAY['student','work','job_seeker','family','freelance','au_pair'],
 '{}', 1, '{}',
 'Wohnsitzanmeldung (Anmeldung)',
 'Address Registration (Anmeldung)',
 'einwohnermeldeamt', false, 1,
 '14_days_after_arrival',
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/living-in-germany/housing/registration'),

-- 2. Open Bank Account (all visa types, all states)
('bank_account',
 ARRAY['student','work','job_seeker','family','freelance'],
 '{}', 2, ARRAY['anmeldung'],
 'Bankkonto eroeffnen',
 'Open a German Bank Account',
 'bank', false, 7, NULL,
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/living-in-germany/money-insurance/bank-account'),

-- 3. Health Insurance Enrollment (student + work, all states)
('health_insurance',
 ARRAY['student','work','job_seeker','family','freelance'],
 '{}', 3, ARRAY['anmeldung'],
 'Krankenversicherung abschliessen',
 'Enroll in Health Insurance',
 'insurance', true, 3, NULL,
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/living-in-germany/money-insurance/health-insurance'),

-- 4. Activate Blocked Account (students only, all states)
('sperrkonto_activation',
 ARRAY['student'],
 '{}', 4, ARRAY['bank_account'],
 'Sperrkonto aktivieren',
 'Activate Blocked Account (Sperrkonto)',
 'online', true, 5, NULL,
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/visa-residence/living-in-germany/blocked-account'),

-- 5. University Enrollment (students only, all states)
('university_enrollment',
 ARRAY['student'],
 '{}', 5, ARRAY['health_insurance'],
 'Immatrikulation an der Hochschule',
 'University Enrollment (Immatrikulation)',
 'university', false, 1, NULL,
 '2026-03-15',
 'https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/enrolment/'),

-- 6. Tax ID Registration (work visa only, all states)
('tax_id',
 ARRAY['work','freelance'],
 '{}', 4, ARRAY['anmeldung'],
 'Steuerliche Identifikationsnummer erhalten',
 'Receive Tax ID (Steuerliche Identifikationsnummer)',
 'online', true, 14, NULL,
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/working-in-germany/taxes'),

-- 7. Social Security Registration (work visa only, all states)
('social_security',
 ARRAY['work'],
 '{}', 5, ARRAY['health_insurance'],
 'Sozialversicherungsnummer erhalten',
 'Register for Social Security Number',
 'online', true, 14, NULL,
 '2026-03-15',
 'https://www.make-it-in-germany.com/en/working-in-germany/social-security'),

-- 8. Residence Permit - Bavaria
('residence_permit_by',
 ARRAY['student','work','job_seeker','family','freelance'],
 ARRAY['DE-BY'], 6, ARRAY['anmeldung','health_insurance'],
 'Aufenthaltserlaubnis beantragen (Bayern)',
 'Apply for Residence Permit (Bavaria)',
 'auslaenderbehoerde', false, 42,
 '90_days_before_visa_expiry',
 '2026-03-15',
 'https://www.kreisverwaltungsreferat.muenchen.de/dienstleistungen/auslaenderbehoerde.html'),

-- 9. Residence Permit - Berlin
('residence_permit_be',
 ARRAY['student','work','job_seeker','family','freelance'],
 ARRAY['DE-BE'], 6, ARRAY['anmeldung','health_insurance'],
 'Aufenthaltserlaubnis beantragen (Berlin)',
 'Apply for Residence Permit (Berlin)',
 'auslaenderbehoerde', false, 56,
 '90_days_before_visa_expiry',
 '2026-03-15',
 'https://www.berlin.de/labo/willkommen-in-berlin/'),

-- 10. Residence Permit - NRW
('residence_permit_nw',
 ARRAY['student','work','job_seeker','family','freelance'],
 ARRAY['DE-NW'], 6, ARRAY['anmeldung','health_insurance'],
 'Aufenthaltserlaubnis beantragen (NRW)',
 'Apply for Residence Permit (NRW)',
 'auslaenderbehoerde', false, 35,
 '90_days_before_visa_expiry',
 '2026-03-15',
 'https://www.mkjfgfi.nrw/willkommen'),

-- 11. Radio/TV Tax Registration (all visa types, all states)
('rundfunkbeitrag',
 ARRAY['student','work','job_seeker','family','freelance','au_pair'],
 '{}', 7, ARRAY['anmeldung'],
 'Rundfunkbeitrag anmelden',
 'Register for Radio/TV Tax (Rundfunkbeitrag)',
 'online', true, 1, NULL,
 '2026-03-15',
 'https://www.rundfunkbeitrag.de/welcome/englisch/index_ger.html');


-- ============================================================================
-- DOCUMENT REQUIREMENTS
-- ============================================================================

-- Anmeldung documents
INSERT INTO public.document_requirements (step_slug, document_name_en, document_name_de, specifications, needs_certified_copy, needs_translation, needs_apostille, where_to_get, estimated_cost_eur, applies_to_nationalities, applies_to_bundeslaender) VALUES

('anmeldung', 'Valid passport', 'Gueltiger Reisepass',
 '{"validity": "Must be valid for the duration of your planned stay", "type": "Original required"}'::jsonb,
 false, false, false,
 'Bring your original passport. No copies accepted.', NULL, '{}', '{}'),

('anmeldung', 'Rental contract or landlord confirmation', 'Mietvertrag oder Wohnungsgeberbestaetigung',
 '{"format": "Wohnungsgeberbestaetigung form signed by your landlord", "note": "Landlord is legally required to provide this"}'::jsonb,
 false, false, false,
 'Request from your landlord. Use the official Wohnungsgeberbestaetigung form available at your city''s website.', NULL, '{}', '{}'),

('anmeldung', 'Registration form (Anmeldeformular)', 'Anmeldeformular',
 '{"pages": 1, "language": "German", "note": "Available at the Einwohnermeldeamt or online"}'::jsonb,
 false, false, false,
 'Download from your city website or pick up at the Einwohnermeldeamt. Can also be filled on-site.', NULL, '{}', '{}'),

-- Bank Account documents
('bank_account', 'Valid passport', 'Gueltiger Reisepass',
 '{"type": "Original required"}'::jsonb,
 false, false, false,
 'Bring your original passport.', NULL, '{}', '{}'),

('bank_account', 'Confirmation of registration (Meldebestaetigung)', 'Meldebestaetigung',
 '{"note": "Received after completing Anmeldung"}'::jsonb,
 false, false, false,
 'You receive this automatically after Anmeldung. Keep the original safe.', NULL, '{}', '{}'),

('bank_account', 'Proof of student enrollment or employment contract', 'Immatrikulationsbescheinigung oder Arbeitsvertrag',
 '{"note": "Bank may ask for proof of income or student status"}'::jsonb,
 false, false, false,
 'University enrollment letter or your signed employment contract.', NULL, '{}', '{}'),

-- Health Insurance documents
('health_insurance', 'Valid passport', 'Gueltiger Reisepass',
 '{"type": "Original or copy"}'::jsonb,
 false, false, false,
 'Passport or national ID card.', NULL, '{}', '{}'),

('health_insurance', 'Confirmation of registration (Meldebestaetigung)', 'Meldebestaetigung',
 '{"note": "From your Anmeldung"}'::jsonb,
 false, false, false,
 'Copy of your Anmeldung confirmation.', NULL, '{}', '{}'),

('health_insurance', 'University enrollment certificate', 'Immatrikulationsbescheinigung',
 '{"note": "For student health insurance rates"}'::jsonb,
 false, false, false,
 'Download from your university portal or request from student services.', NULL, '{}', '{}'),

('health_insurance', 'Employment contract', 'Arbeitsvertrag',
 '{"note": "Required for employer-provided statutory insurance"}'::jsonb,
 false, false, false,
 'Your signed employment contract from your employer.', NULL, '{}', '{}'),

-- Sperrkonto Activation documents
('sperrkonto_activation', 'Passport copy', 'Reisepasskopie',
 '{"note": "Digital copy for online verification"}'::jsonb,
 false, false, false,
 'Scan or clear photo of your passport data page.', NULL, '{}', '{}'),

('sperrkonto_activation', 'German bank account details', 'Deutsche Bankverbindung',
 '{"note": "IBAN for monthly disbursement"}'::jsonb,
 false, false, false,
 'Your new German bank IBAN from step 2.', NULL, '{}', '{}'),

-- University Enrollment documents
('university_enrollment', 'Admission letter (Zulassungsbescheid)', 'Zulassungsbescheid',
 '{"note": "Original admission letter from the university"}'::jsonb,
 false, false, false,
 'Received from your university after successful application.', NULL, '{}', '{}'),

('university_enrollment', 'Health insurance confirmation', 'Krankenversicherungsnachweis',
 '{"note": "Confirmation letter from your health insurance provider"}'::jsonb,
 false, false, false,
 'Request from your health insurance provider. Most provide this digitally.', NULL, '{}', '{}'),

('university_enrollment', 'Passport', 'Reisepass',
 '{"type": "Original required"}'::jsonb,
 false, false, false,
 'Bring your original passport.', NULL, '{}', '{}'),

('university_enrollment', 'Semester fee payment receipt', 'Semesterbeitrag-Zahlungsnachweis',
 '{"note": "Proof of semester fee payment (usually EUR 100-350)"}'::jsonb,
 false, false, false,
 'Transfer the semester fee to the university account and keep the receipt.', 300.00, '{}', '{}'),

-- Residence Permit documents (Bavaria)
('residence_permit_by', 'Biometric passport photo', 'Biometrisches Passfoto',
 '{"size": "35x45mm", "background": "white or light grey", "quantity": 1, "recent": "within last 6 months"}'::jsonb,
 false, false, false,
 'Any photo booth (Fotoautomat) or photography studio. Biometric requirements must be met.', 12.00, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Valid passport', 'Gueltiger Reisepass',
 '{"validity": "Must be valid for at least 3 months beyond the requested permit duration"}'::jsonb,
 false, false, false,
 'Bring your original passport.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Proof of health insurance', 'Nachweis Krankenversicherung',
 '{"type": "Confirmation letter from statutory or private health insurance"}'::jsonb,
 false, false, false,
 'Request a confirmation letter (Versicherungsbestaetigung) from your health insurance provider.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Proof of financial means', 'Finanzierungsnachweis',
 '{"type": "Sperrkonto confirmation, scholarship letter, employment contract, or Verpflichtungserklaerung"}'::jsonb,
 false, false, false,
 'Bank statement showing Sperrkonto balance, scholarship confirmation, or employment contract showing salary.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Rental contract', 'Mietvertrag',
 '{"note": "Proof of accommodation in Germany"}'::jsonb,
 false, false, false,
 'Your signed rental contract or sublease agreement.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Enrollment certificate or employment contract', 'Immatrikulationsbescheinigung oder Arbeitsvertrag',
 '{"note": "Students: enrollment certificate. Workers: employment contract + job description"}'::jsonb,
 false, false, false,
 'Download from university portal or provide your signed employment contract.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Application form for residence permit', 'Antrag auf Erteilung eines Aufenthaltstitels',
 '{"note": "Official application form, available at the Auslaenderbehoerde or online"}'::jsonb,
 false, false, false,
 'Download from the Auslaenderbehoerde website or pick up at the office.', NULL, '{}', ARRAY['DE-BY']),

('residence_permit_by', 'Degree certificates (if applicable)', 'Zeugnisse und Abschlussurkunden',
 '{"note": "For work permits: proof of qualifications. May need certified translation."}'::jsonb,
 true, true, false,
 'Original degree certificates. Get certified translations from a sworn translator (beeidigte/r Uebersetzer/in).', 50.00, '{}', ARRAY['DE-BY']),

-- Residence Permit documents (Berlin) — same core docs, different office context
('residence_permit_be', 'Biometric passport photo', 'Biometrisches Passfoto',
 '{"size": "35x45mm", "background": "white or light grey", "quantity": 1, "recent": "within last 6 months"}'::jsonb,
 false, false, false,
 'Any photo booth or photography studio.', 12.00, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Valid passport', 'Gueltiger Reisepass',
 '{"validity": "Must be valid for at least 3 months beyond the requested permit duration"}'::jsonb,
 false, false, false,
 'Bring your original passport.', NULL, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Proof of health insurance', 'Nachweis Krankenversicherung',
 '{"type": "Confirmation letter from statutory or private health insurance"}'::jsonb,
 false, false, false,
 'Request a Versicherungsbestaetigung from your health insurance provider.', NULL, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Proof of financial means', 'Finanzierungsnachweis',
 '{"type": "Sperrkonto confirmation, scholarship letter, employment contract, or Verpflichtungserklaerung"}'::jsonb,
 false, false, false,
 'Bank statement, scholarship confirmation, or employment contract.', NULL, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Rental contract', 'Mietvertrag',
 '{"note": "Proof of accommodation in Berlin"}'::jsonb,
 false, false, false,
 'Your signed rental contract.', NULL, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Enrollment certificate or employment contract', 'Immatrikulationsbescheinigung oder Arbeitsvertrag',
 '{"note": "Students: enrollment certificate. Workers: employment contract."}'::jsonb,
 false, false, false,
 'University portal download or signed employment contract.', NULL, '{}', ARRAY['DE-BE']),

('residence_permit_be', 'Application form', 'Antragsformular',
 '{"note": "Berlin LEA/LABO application form"}'::jsonb,
 false, false, false,
 'Download from berlin.de/labo or pick up at the office. Book appointment via berlin.de/labo/terminvereinbarung.', NULL, '{}', ARRAY['DE-BE']),

-- Residence Permit documents (NRW)
('residence_permit_nw', 'Biometric passport photo', 'Biometrisches Passfoto',
 '{"size": "35x45mm", "background": "white or light grey", "quantity": 1, "recent": "within last 6 months"}'::jsonb,
 false, false, false,
 'Any photo booth or photography studio.', 12.00, '{}', ARRAY['DE-NW']),

('residence_permit_nw', 'Valid passport', 'Gueltiger Reisepass',
 '{"validity": "Must be valid for at least 3 months beyond the requested permit duration"}'::jsonb,
 false, false, false,
 'Bring your original passport.', NULL, '{}', ARRAY['DE-NW']),

('residence_permit_nw', 'Proof of health insurance', 'Nachweis Krankenversicherung',
 '{"type": "Confirmation letter from statutory or private health insurance"}'::jsonb,
 false, false, false,
 'Request a Versicherungsbestaetigung from your health insurance provider.', NULL, '{}', ARRAY['DE-NW']),

('residence_permit_nw', 'Proof of financial means', 'Finanzierungsnachweis',
 '{"type": "Sperrkonto confirmation, scholarship letter, employment contract"}'::jsonb,
 false, false, false,
 'Bank statement, scholarship confirmation, or employment contract.', NULL, '{}', ARRAY['DE-NW']),

('residence_permit_nw', 'Rental contract', 'Mietvertrag',
 '{"note": "Proof of accommodation"}'::jsonb,
 false, false, false,
 'Your signed rental contract.', NULL, '{}', ARRAY['DE-NW']),

('residence_permit_nw', 'Enrollment certificate or employment contract', 'Immatrikulationsbescheinigung oder Arbeitsvertrag',
 '{"note": "Students: enrollment certificate. Workers: employment contract."}'::jsonb,
 false, false, false,
 'University portal download or signed employment contract.', NULL, '{}', ARRAY['DE-NW']),

-- Tax ID documents
('tax_id', 'Confirmation of registration (Meldebestaetigung)', 'Meldebestaetigung',
 '{"note": "Tax ID is sent automatically by mail after Anmeldung within 2-4 weeks"}'::jsonb,
 false, false, false,
 'No action needed. The Bundeszentralamt fuer Steuern sends your Steuer-ID by mail after Anmeldung. If not received within 4 weeks, contact your local Finanzamt.', NULL, '{}', '{}'),

-- Social Security documents
('social_security', 'Employment contract', 'Arbeitsvertrag',
 '{"note": "Your employer usually handles social security registration"}'::jsonb,
 false, false, false,
 'Your employer registers you for social security. You will receive your Sozialversicherungsausweis by mail.', NULL, '{}', '{}'),

-- Rundfunkbeitrag documents
('rundfunkbeitrag', 'Confirmation of registration (Meldebestaetigung)', 'Meldebestaetigung',
 '{"note": "Register online at rundfunkbeitrag.de. EUR 18.36/month."}'::jsonb,
 false, false, false,
 'Register online at rundfunkbeitrag.de. Students may apply for exemption (Befreiung) with BAfoeg or scholarship proof.', 18.36, '{}', '{}');
