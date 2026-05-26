-- Seed: immigration offices (Phase 4 — WS2)
--
-- Sourced from the team's "Standard Requirement Tags" doc (Bavaria/Berlin
-- office URLs + permit categories) and the NRW research doc (city contact
-- details). All rows verified against official municipal pages on 2026-05-26.
-- booking_url is set only where the doc provided an online appointment/service
-- portal; watchable stays false until an admin reviews each portal's ToS.

INSERT INTO public.offices
  (bundesland, city, office_type, name_de, permit_categories, address, booking_url, contact_email, phone, source_url, verified_at)
VALUES
  -- ===== BAVARIA =====
  ('DE-BY', 'Munich', 'auslaenderbehoerde', 'Ausländerbehörde München',
    ARRAY['eu_blue_card','work','student','permanent_residency','family_reunification','self_employment'],
    NULL, NULL, NULL, NULL,
    'https://stadt.muenchen.de/service/en-GB/info/10422541/', '2026-05-26'),
  ('DE-BY', 'Nuremberg', 'auslaenderbehoerde', 'Ausländerbehörde Nürnberg',
    ARRAY['residence','student','work','visa_extension','permanent_residency'],
    NULL, NULL, NULL, NULL,
    'https://www.nuernberg.de/internet/auslaenderbehoerde/', '2026-05-26'),
  ('DE-BY', 'Augsburg', 'auslaenderbehoerde', 'Ausländerbehörde Augsburg',
    ARRAY['residence','student','work','family_reunification'],
    NULL, NULL, NULL, NULL,
    'https://www.augsburg.de/buergerservice-rathaus/buergerservice/auslaenderbehoerde', '2026-05-26'),
  ('DE-BY', 'Regensburg', 'auslaenderbehoerde', 'Ausländeramt Regensburg',
    ARRAY['student','work','permanent_residency','visa_consultation'],
    NULL, NULL, NULL, NULL,
    'https://www.regensburg.de/rathaus/aemteruebersicht/direktorium-3/buergerzentrum/auslaenderamt', '2026-05-26'),
  ('DE-BY', 'Erlangen', 'auslaenderbehoerde', 'Amt für Ausländerangelegenheiten Erlangen',
    ARRAY['research','student','work','visa_extension'],
    NULL, NULL, NULL, NULL,
    'https://erlangen.de/amt-fuer-auslaenderangelegenheiten', '2026-05-26'),
  ('DE-BY', 'Passau', 'auslaenderbehoerde', 'Ausländeramt Passau',
    ARRAY['residence','student','work'],
    NULL, NULL, NULL, NULL,
    'https://www.passau.de/Rathaus-Buergerservice/Verwaltung/Aemter-und-Dienststellen/Auslaenderamt.aspx', '2026-05-26'),

  -- ===== BERLIN =====
  ('DE-BE', 'Berlin', 'auslaenderbehoerde', 'Landesamt für Einwanderung (LEA)',
    ARRAY['residence','work','student','visa_extension','permanent_residency','eu_blue_card'],
    NULL, 'https://www.berlin.de/einwanderung/en/', NULL, NULL,
    'https://www.berlin.de/einwanderung/en/', '2026-05-26'),

  -- ===== NORTH RHINE-WESTPHALIA =====
  ('DE-NW', 'Cologne', 'auslaenderbehoerde', 'Ausländeramt Köln',
    ARRAY['residence','student','work','settlement'],
    'Dillenburger Str. 56-66, 51105 Köln', NULL, 'auslaenderamt@stadt-koeln.de', '0221 221-25601',
    'https://www.stadt-koeln.de/leben-in-koeln/soziales/auslaenderamt/index.html', '2026-05-26'),
  ('DE-NW', 'Düsseldorf', 'auslaenderbehoerde', 'Ausländeramt Düsseldorf',
    ARRAY['residence','student','work','vocational_training','self_employment'],
    NULL, 'https://service.duesseldorf.de/online-dienst-auslaenderbehoerde#/', 'auslaenderamt@duesseldorf.de', NULL,
    'https://service.duesseldorf.de/suche/-/egov-bis-detail/dienstleistung/189/show', '2026-05-26'),
  ('DE-NW', 'Dortmund', 'auslaenderbehoerde', 'Amt für Migration Dortmund',
    ARRAY['student','work','visa','education_migration'],
    'Olpe 1, 44137 Dortmund', NULL, 'studententeam@stadtdo.de', '+49 231 50-29989',
    'https://www.dortmund.de/rathaus-und-verwaltung/verwaltung/amt-fuer-migration/', '2026-05-26'),
  ('DE-NW', 'Bochum', 'auslaenderbehoerde', 'Ausländerbüro Bochum',
    ARRAY['student','work','vocational_training','skilled_worker'],
    'Willy-Brandt-Platz 2-6, 44777 Bochum', NULL, NULL, '0234 910-3777',
    'https://www.bochum.de/Auslaenderbuero', '2026-05-26'),
  ('DE-NW', 'Wuppertal', 'auslaenderbehoerde', 'Ausländerbehörde Wuppertal',
    ARRAY['student','work','employment'],
    'Johannes-Rau-Platz 1, 42275 Wuppertal', NULL, NULL, NULL,
    'https://integration.wuppertal.de/auslaenderbehoerde/auslaenderbehoerde/studium.php', '2026-05-26'),
  ('DE-NW', 'Bonn', 'auslaenderbehoerde', 'Ausländeramt Bonn',
    ARRAY['residence','student','work'],
    'Oxfordstraße 19, 53111 Bonn', NULL, NULL, '+49 228 776000',
    'https://www.bonn.de/', '2026-05-26'),
  ('DE-NW', 'Münster', 'auslaenderbehoerde', 'Ausländerbehörde Münster',
    ARRAY['student','work','skilled_worker','vocational_training'],
    'Ludgeriplatz 4, 48151 Münster', NULL, NULL, '02 51/4 92-36 36',
    'https://www.stadt-muenster.de/aufenthaltsrecht/beschaeftigung/fachkraefte', '2026-05-26'),
  ('DE-NW', 'Bielefeld', 'auslaenderbehoerde', 'Ausländerbehörde Bielefeld',
    ARRAY['residence','student','work'],
    'Niederwall 23, 33602 Bielefeld', NULL, NULL, '+49 521 51-0',
    'https://www.bielefeld.de/', '2026-05-26'),
  ('DE-NW', 'Aachen', 'auslaenderbehoerde', 'Ausländeramt StädteRegion Aachen',
    ARRAY['student','work','residence'],
    'Hackländerstraße 1, 52064 Aachen', NULL, 'info.auslaendische.studenten@staedteregion-aachen.de', '+49 241 5198-3430',
    'https://www.staedteregion-aachen.de/de/navigation/aemter/auslaenderamt-a-33', '2026-05-26'),
  ('DE-NW', 'Essen', 'auslaenderbehoerde', 'Ausländerbehörde Essen',
    ARRAY['residence','student','work','family_reunification'],
    'Kruppstraße 16, 45128 Essen', NULL, 'auslaenderbehoerde@essen.de', '+49 201 88-38883',
    'https://www.essen.de/organisationen/detail_1188461.de.html', '2026-05-26');
