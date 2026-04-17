-- Migration: Seed the five MVP forms for Phase 3c (Form-Filling Guide).
--
-- Form records & field content are hand-curated from the authoritative
-- sources listed below. Every field in the JSONB conforms to the
-- `FormField` TypeScript interface in packages/shared-types/src/roadmap.types.ts:
--   { field_id, label_de, label_en, input_type, instructions_en,
--     common_mistakes, example_value, required, ai_can_explain }
--
-- Sources consulted for field content (as of 2026-04-16):
--   - BAMF "Antrag auf Erteilung eines Aufenthaltstitels" (AA4), federal template
--     https://www.bamf.de → Formulare → Aufenthaltstitel
--   - KVR München: Anmeldungsformular + FAQ Ausländerbehörde
--     https://stadt.muenchen.de/buergerservice/ausland-migration.html
--   - Berlin LEA: Anmeldeformular (service.berlin.de/dienstleistung/120335/)
--     + Aufenthaltstitel service entry (service.berlin.de/dienstleistung/120686/)
--   - TK & DAK student enrolment forms (publicly downloadable)
--     https://www.tk.de/ and https://www.dak.de/
--
-- Curation policy:
--   - ai_can_explain: true only for fields that materially benefit from
--     Claude's personalisation (dates with deadline math, legal terms,
--     choice between options). Trivial name/address/DOB fields stay false.
--   - common_mistakes: 3-4 realistic pitfalls sourced from official
--     warnings on the form or from municipality FAQs.
--   - example_value: one concrete value a typical user would enter.
--     Never PII; generic placeholders.
--
-- If a field is updated post-ship, bump verified_at on the parent row.

-- ============================================================================
-- FORM 1: Anmeldung (Bavaria / München)
-- ============================================================================

INSERT INTO public.forms (form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, fields, download_url, verified_at)
VALUES (
  'anmeldung_de_by',
  'Wohnsitzanmeldung (Bayern)',
  'Address Registration (Bavaria)',
  ARRAY['DE-BY'],
  ARRAY['student','work','job_seeker','family','freelance','au_pair'],
  'anmeldung',
  $FIELDS$
  [
    {
      "field_id": "last_name",
      "label_de": "Familienname",
      "label_en": "Last name",
      "input_type": "text",
      "instructions_en": "Your family name exactly as it appears on your passport. If the passport shows it in non-Latin script, use the Latin transliteration from the visa label.",
      "common_mistakes": ["Entering the first name first", "Omitting middle names or hyphens", "Using a spouse's name if your passport still shows the birth name"],
      "example_value": "Müller",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "first_names",
      "label_de": "Vornamen",
      "label_en": "First names (all given names)",
      "input_type": "text",
      "instructions_en": "All given names from your passport, in the order shown. Separate multiple names with spaces. Middle names are mandatory if present on the passport.",
      "common_mistakes": ["Entering only the preferred name", "Swapping the order of middle names", "Using an English equivalent instead of the passport spelling"],
      "example_value": "Anna Maria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "birth_name",
      "label_de": "Geburtsname",
      "label_en": "Birth name (if different)",
      "input_type": "text",
      "instructions_en": "Only fill this if your current family name differs from the name you were born with (e.g. after marriage). Leave blank otherwise — do not copy your last name here.",
      "common_mistakes": ["Copying the last name when no change occurred", "Writing 'n/a' or 'none' (leave the field blank instead)"],
      "example_value": "",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "date_of_birth",
      "label_de": "Geburtsdatum",
      "label_en": "Date of birth",
      "input_type": "date",
      "instructions_en": "Your full date of birth. German forms expect DD.MM.YYYY; the online KVR form renders a date picker regardless of your locale.",
      "common_mistakes": ["Entering the date in MM/DD/YYYY format", "Using a date from a previous visa label instead of the passport"],
      "example_value": "1998-05-14",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_birth",
      "label_de": "Geburtsort",
      "label_en": "Place of birth (city, country)",
      "input_type": "text",
      "instructions_en": "City and country of birth as shown on your passport. If the passport shows only a city, add the current country name in parentheses.",
      "common_mistakes": ["Entering only the country", "Using a historical country name that no longer exists", "Abbreviating the city"],
      "example_value": "Lagos, Nigeria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "nationality",
      "label_de": "Staatsangehörigkeit(en)",
      "label_en": "Nationality (or nationalities)",
      "input_type": "text",
      "instructions_en": "List every nationality you currently hold. If you have more than one, list all separated by commas — German law permits dual nationality for many combinations and the Meldebehörde wants the complete record.",
      "common_mistakes": ["Listing only the country you live in", "Using 'EU citizen' instead of the actual country", "Omitting a dormant nationality you haven't used in years"],
      "example_value": "Nigerian",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "marital_status",
      "label_de": "Familienstand",
      "label_en": "Marital status",
      "input_type": "select",
      "instructions_en": "Your current civil status. If you are in a legally registered partnership outside Germany, choose 'eingetragene Lebenspartnerschaft'. Religious-only marriages that are not civilly registered count as 'ledig' (single).",
      "common_mistakes": ["Selecting 'verheiratet' based on a religious ceremony only", "Selecting 'geschieden' before a divorce decree is issued"],
      "example_value": "ledig",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "religion",
      "label_de": "Religion",
      "label_en": "Religious affiliation",
      "input_type": "select",
      "instructions_en": "Only declare a church membership if you want to remain registered with that church in Germany. Registered membership triggers Kirchensteuer (church tax) of roughly 8-9% of your income tax. Most non-German residents select 'ohne Angabe' (no declaration).",
      "common_mistakes": ["Declaring a religion that is not one of the three tax-collecting churches (Catholic, Protestant, Jewish)", "Assuming the field is mandatory — it is not"],
      "example_value": "ohne Angabe",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "move_in_date",
      "label_de": "Einzugsdatum",
      "label_en": "Date you moved into the new address",
      "input_type": "date",
      "instructions_en": "The actual date you moved in — NOT the date you're filling out this form. You must register within 14 days of this date. If the date is more than 14 days ago, KVR may charge a late-registration fee (up to €1,000 in theory, usually waived for first-time foreigners).",
      "common_mistakes": ["Using today's date instead of the actual move-in date", "Backdating to avoid the 14-day rule — KVR cross-checks with the Wohnungsgeberbestätigung"],
      "example_value": "2026-04-10",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "new_address",
      "label_de": "Neue Anschrift",
      "label_en": "New address in Germany",
      "input_type": "text",
      "instructions_en": "Full street, house number, postal code, and city — in that order. Include any apartment or staircase identifier (e.g. 'Hinterhaus', '3. OG rechts'). Must match exactly what the landlord will write on the Wohnungsgeberbestätigung.",
      "common_mistakes": ["Writing 'c/o' to name a sub-let host — use the legal address line only", "Omitting the apartment identifier, which can cause mail delivery issues later"],
      "example_value": "Kaulbachstraße 45, 80539 München",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "previous_address",
      "label_de": "Bisherige Anschrift",
      "label_en": "Previous address (anywhere in the world)",
      "input_type": "text",
      "instructions_en": "The address you lived at immediately before this one. If you moved to Germany from abroad, write the full foreign address including country. Do not write 'abroad' or leave blank — the field is mandatory.",
      "common_mistakes": ["Writing 'abroad' instead of the real address", "Using a shipping/mail address instead of your actual residence", "Leaving the field blank"],
      "example_value": "12 Ikeja Road, Lagos 100001, Nigeria",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "wohnungsgeber_confirmation",
      "label_de": "Wohnungsgeberbestätigung liegt vor",
      "label_en": "I have the Wohnungsgeberbestätigung (landlord confirmation)",
      "input_type": "checkbox",
      "instructions_en": "Check this only if you physically have the signed Wohnungsgeberbestätigung form from your landlord. Without this form, the Anmeldung cannot be completed — KVR will turn you away at the appointment. The landlord must issue it within 2 weeks of your move-in.",
      "common_mistakes": ["Checking the box based on a rental contract alone — the Wohnungsgeberbestätigung is a separate statutory form", "Not realising the landlord is legally required to provide it (Bundesmeldegesetz §19)"],
      "example_value": "true",
      "required": true,
      "ai_can_explain": true
    }
  ]
  $FIELDS$::jsonb,
  'https://stadt.muenchen.de/infos/faq-auslaenderbehoerde.html',
  '2026-04-16'
)
ON CONFLICT (form_code) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  bundeslaender = EXCLUDED.bundeslaender,
  visa_types = EXCLUDED.visa_types,
  related_step_slug = EXCLUDED.related_step_slug,
  fields = EXCLUDED.fields,
  download_url = EXCLUDED.download_url,
  verified_at = EXCLUDED.verified_at;

-- ============================================================================
-- FORM 2: Anmeldung (Berlin)
-- ============================================================================

INSERT INTO public.forms (form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, fields, download_url, verified_at)
VALUES (
  'anmeldung_de_be',
  'Wohnsitzanmeldung (Berlin)',
  'Address Registration (Berlin)',
  ARRAY['DE-BE'],
  ARRAY['student','work','job_seeker','family','freelance','au_pair'],
  'anmeldung',
  $FIELDS$
  [
    {
      "field_id": "last_name",
      "label_de": "Familienname",
      "label_en": "Last name",
      "input_type": "text",
      "instructions_en": "Your family name exactly as on your passport. Berlin LEA cross-references this with your visa label — any spelling mismatch leads to a second appointment.",
      "common_mistakes": ["Entering the first name here", "Using a spouse's name when the passport still shows the maiden name"],
      "example_value": "Müller",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "first_names",
      "label_de": "Vornamen",
      "label_en": "First names (all given names)",
      "input_type": "text",
      "instructions_en": "All given names from your passport in the exact order shown. Multiple names separated by spaces.",
      "common_mistakes": ["Entering only the preferred name", "Swapping the order of middle names"],
      "example_value": "Anna Maria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "birth_name",
      "label_de": "Geburtsname",
      "label_en": "Birth name (if different from current)",
      "input_type": "text",
      "instructions_en": "Only required if your current family name differs from the one you were born with. Leave blank otherwise — do NOT repeat the last name.",
      "common_mistakes": ["Copying the last name when no name change occurred", "Writing 'n/a' instead of leaving blank"],
      "example_value": "",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "date_of_birth",
      "label_de": "Geburtsdatum",
      "label_en": "Date of birth",
      "input_type": "date",
      "instructions_en": "Full date of birth as on your passport. The Berlin Termin-Portal uses a date picker; the downloaded PDF expects DD.MM.YYYY.",
      "common_mistakes": ["Using MM/DD/YYYY format on the paper form", "Copying a date from an expired visa"],
      "example_value": "1998-05-14",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_birth",
      "label_de": "Geburtsort und -land",
      "label_en": "Place of birth (city, country)",
      "input_type": "text",
      "instructions_en": "City and country exactly as on the passport. If the passport shows only the city, add the current country name in parentheses.",
      "common_mistakes": ["Entering only the country", "Using a historical country name"],
      "example_value": "Lagos, Nigeria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "nationality",
      "label_de": "Staatsangehörigkeit(en)",
      "label_en": "Nationality (or nationalities)",
      "input_type": "text",
      "instructions_en": "Every nationality you currently hold, comma-separated. Dual nationality is legal in Germany for most combinations — declare all of them.",
      "common_mistakes": ["Listing only one when you have two", "Using 'EU' instead of the specific country"],
      "example_value": "Nigerian",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "marital_status",
      "label_de": "Familienstand",
      "label_en": "Marital status",
      "input_type": "select",
      "instructions_en": "Your civil status at this moment. Religious-only marriages not civilly registered count as 'ledig'. A legally-recognised foreign partnership not equivalent to German marriage may need to be discussed with the Standesamt.",
      "common_mistakes": ["Selecting 'verheiratet' for a religious-only ceremony", "Selecting 'geschieden' before the divorce decree is finalised"],
      "example_value": "ledig",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "religion",
      "label_de": "Religion",
      "label_en": "Religious affiliation",
      "input_type": "select",
      "instructions_en": "Declaring membership in a tax-collecting church (Catholic, Protestant, Jewish) triggers Kirchensteuer of ~9% on your income tax. Most non-German residents select 'ohne Angabe' to opt out.",
      "common_mistakes": ["Declaring a tax-collecting church membership by accident", "Assuming the field is mandatory — it is not"],
      "example_value": "ohne Angabe",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "move_in_date",
      "label_de": "Einzugsdatum",
      "label_en": "Date you moved in",
      "input_type": "date",
      "instructions_en": "The date you physically moved in — NOT the date of this form. Legal deadline: register within 14 days. Berlin LEA's backlog often exceeds this, but you must book your appointment within 14 days to stay compliant.",
      "common_mistakes": ["Using today's date", "Backdating to 'fit' the 14-day rule — LEA cross-checks with the Wohnungsgeberbestätigung"],
      "example_value": "2026-04-10",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "new_address",
      "label_de": "Neue Anschrift",
      "label_en": "New address in Berlin",
      "input_type": "text",
      "instructions_en": "Full street, house number, postal code, and city. Include apartment identifier (e.g. '2. Hinterhaus, 3. OG links'). Must match the Wohnungsgeberbestätigung exactly.",
      "common_mistakes": ["Using a c/o shipping address", "Omitting the apartment identifier"],
      "example_value": "Friedrichstraße 110, 10117 Berlin",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "previous_address",
      "label_de": "Bisherige Anschrift",
      "label_en": "Previous address (worldwide)",
      "input_type": "text",
      "instructions_en": "The address you lived at right before this one. If moving from abroad, write the full foreign address including country. 'Abroad' is not acceptable.",
      "common_mistakes": ["Writing 'abroad'", "Using a mailing address instead of actual residence"],
      "example_value": "12 Ikeja Road, Lagos 100001, Nigeria",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "wohnungsgeber_confirmation",
      "label_de": "Wohnungsgeberbestätigung liegt vor",
      "label_en": "I have the Wohnungsgeberbestätigung (landlord confirmation)",
      "input_type": "checkbox",
      "instructions_en": "Only check if you physically hold the signed Wohnungsgeberbestätigung from your landlord. Without it, the Berlin LEA will refuse the Anmeldung. The landlord is legally required to provide it within 2 weeks of move-in (Bundesmeldegesetz §19).",
      "common_mistakes": ["Checking this with only a rental contract in hand", "Not knowing the landlord is legally required to issue it"],
      "example_value": "true",
      "required": true,
      "ai_can_explain": true
    }
  ]
  $FIELDS$::jsonb,
  'https://service.berlin.de/dienstleistung/120335/',
  '2026-04-16'
)
ON CONFLICT (form_code) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  bundeslaender = EXCLUDED.bundeslaender,
  visa_types = EXCLUDED.visa_types,
  related_step_slug = EXCLUDED.related_step_slug,
  fields = EXCLUDED.fields,
  download_url = EXCLUDED.download_url,
  verified_at = EXCLUDED.verified_at;

-- ============================================================================
-- FORM 3: Aufenthaltstitel (Bayern / AA4 federal template)
-- ============================================================================

INSERT INTO public.forms (form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, fields, download_url, verified_at)
VALUES (
  'aufenthaltstitel_de_by',
  'Antrag auf Erteilung eines Aufenthaltstitels (Bayern)',
  'Residence Permit Application (Bavaria)',
  ARRAY['DE-BY'],
  ARRAY['student','work','job_seeker','family','freelance'],
  'residence_permit_by',
  $FIELDS$
  [
    {
      "field_id": "last_name",
      "label_de": "Familienname",
      "label_en": "Last name",
      "input_type": "text",
      "instructions_en": "Exactly as on the passport MRZ (machine-readable zone). Any mismatch between this field and your passport MRZ is the #1 reason applications get delayed.",
      "common_mistakes": ["Using a latinised form that doesn't match the passport MRZ", "Omitting suffixes like 'Jr.' shown on the passport"],
      "example_value": "Müller",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "first_names",
      "label_de": "Vornamen",
      "label_en": "First names (all given names)",
      "input_type": "text",
      "instructions_en": "Every given name as printed on the passport, in order, space-separated.",
      "common_mistakes": ["Using only the common call name", "Swapping middle-name order"],
      "example_value": "Anna Maria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "birth_name",
      "label_de": "Geburtsname",
      "label_en": "Birth name (if different)",
      "input_type": "text",
      "instructions_en": "Only if your current family name differs from birth name. Otherwise leave blank.",
      "common_mistakes": ["Repeating the last name", "Writing 'n/a'"],
      "example_value": "",
      "required": false,
      "ai_can_explain": false
    },
    {
      "field_id": "date_of_birth",
      "label_de": "Geburtsdatum",
      "label_en": "Date of birth",
      "input_type": "date",
      "instructions_en": "From the passport MRZ. DD.MM.YYYY on paper form.",
      "common_mistakes": ["MM/DD/YYYY format"],
      "example_value": "1998-05-14",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_birth",
      "label_de": "Geburtsort und -land",
      "label_en": "Place of birth (city, country)",
      "input_type": "text",
      "instructions_en": "City and country as printed on the passport.",
      "common_mistakes": ["Country only", "Historical country names"],
      "example_value": "Lagos, Nigeria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "nationality",
      "label_de": "Staatsangehörigkeit",
      "label_en": "Nationality",
      "input_type": "text",
      "instructions_en": "Every nationality you currently hold. Dual/multiple nationalities must all be declared.",
      "common_mistakes": ["Omitting a dormant nationality", "Using regional terms like 'EU'"],
      "example_value": "Nigerian",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "marital_status",
      "label_de": "Familienstand",
      "label_en": "Marital status",
      "input_type": "select",
      "instructions_en": "Current civil status. Foreign marriages must be legally recognised to count as 'verheiratet'; religious-only ceremonies count as 'ledig'.",
      "common_mistakes": ["Declaring religious marriage as civil", "Declaring 'geschieden' before decree is final"],
      "example_value": "ledig",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "passport_number",
      "label_de": "Passnummer",
      "label_en": "Passport number",
      "input_type": "text",
      "instructions_en": "Exactly as printed — include any leading zeros. The Ausländerbehörde will refuse the application if even one character is wrong.",
      "common_mistakes": ["Dropping leading zeros", "Confusing the document number with a personal ID number"],
      "example_value": "A12345678",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "passport_issue_date",
      "label_de": "Ausstellungsdatum Pass",
      "label_en": "Passport issue date",
      "input_type": "date",
      "instructions_en": "Date the passport was issued.",
      "common_mistakes": ["Using the validity-from date of the visa instead", "Confusing with expiry date"],
      "example_value": "2022-01-20",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "passport_expiry_date",
      "label_de": "Gültig bis",
      "label_en": "Passport expiry date",
      "input_type": "date",
      "instructions_en": "Your passport must be valid for at least 6 months beyond the requested residence permit period. Otherwise the permit will be capped at passport-minus-6-months.",
      "common_mistakes": ["Applying with a passport that expires in under 12 months — the residence permit will be shortened accordingly", "Confusing with issue date"],
      "example_value": "2032-01-20",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "passport_issuing_authority",
      "label_de": "Ausstellende Behörde",
      "label_en": "Passport issuing authority",
      "input_type": "text",
      "instructions_en": "The authority that issued your passport, as printed on the passport. Usually the country's immigration or foreign affairs ministry.",
      "common_mistakes": ["Writing the embassy abroad instead of the issuing authority printed on the passport"],
      "example_value": "Nigeria Immigration Service",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "current_address_in_germany",
      "label_de": "Wohnanschrift in Deutschland",
      "label_en": "Current address in Germany",
      "input_type": "text",
      "instructions_en": "Your registered address (from the Anmeldung). The Ausländerbehörde verifies this against the Meldebescheinigung — you cannot apply without completing the Anmeldung first.",
      "common_mistakes": ["Applying before completing Anmeldung", "Using a different address than what's on the Meldebescheinigung"],
      "example_value": "Kaulbachstraße 45, 80539 München",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "residence_purpose",
      "label_de": "Aufenthaltszweck",
      "label_en": "Purpose of stay",
      "input_type": "select",
      "instructions_en": "Select the category that matches the residence permit you are applying for. This must match the visa type you entered on — changing purpose mid-application is possible but requires justification and may delay processing by weeks.",
      "common_mistakes": ["Selecting a purpose different from the entry visa without discussing the change", "Selecting 'employment' while still on a student visa without an unlimited work permit"],
      "example_value": "Studium",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "entry_date",
      "label_de": "Einreisedatum",
      "label_en": "Entry date into Germany",
      "input_type": "date",
      "instructions_en": "The date you last entered Germany — the stamp date in your passport. This is NOT the date you first ever came to Germany, just the most recent entry.",
      "common_mistakes": ["Using a previous visit's date", "Guessing instead of checking the passport stamp"],
      "example_value": "2026-03-15",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "entry_visa_type",
      "label_de": "Visum bei Einreise",
      "label_en": "Visa held at entry",
      "input_type": "text",
      "instructions_en": "The type of visa on the label in your passport — e.g. 'D-Visum zum Studium' or 'Schengen C-Visum'. Look at the 'TYPE' line on the visa label.",
      "common_mistakes": ["Writing the general purpose ('study') instead of the label text", "Confusing Schengen (C) with National (D) visa"],
      "example_value": "D-Visum zum Studium",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "employer_or_university_name",
      "label_de": "Arbeitgeber / Hochschule",
      "label_en": "Employer or university name",
      "input_type": "text",
      "instructions_en": "Full legal name of your employer or university. For students, write the full name of the Hochschule as shown on the admission letter.",
      "common_mistakes": ["Using the abbreviated or informal name", "Using the faculty/department name instead of the university"],
      "example_value": "Ludwig-Maximilians-Universität München",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "employer_address",
      "label_de": "Anschrift Arbeitgeber/Hochschule",
      "label_en": "Employer or university address",
      "input_type": "text",
      "instructions_en": "Official postal address of the employer or university — not your department or workplace location.",
      "common_mistakes": ["Using the building you physically work at", "Using the HR dept. mailing address instead of the legal HQ"],
      "example_value": "Geschwister-Scholl-Platz 1, 80539 München",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "monthly_income_eur",
      "label_de": "Einkommen pro Monat (EUR)",
      "label_en": "Monthly gross income in EUR",
      "input_type": "number",
      "instructions_en": "Gross monthly income in euros before tax. For students, this is the Sperrkonto monthly disbursement OR parental support OR scholarship — not the total amount. For workers, the amount on the employment contract.",
      "common_mistakes": ["Entering the annual salary instead of monthly", "Entering net instead of gross", "For students: entering the full Sperrkonto balance instead of the monthly disbursement"],
      "example_value": "1091",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "health_insurance_provider",
      "label_de": "Krankenversicherung",
      "label_en": "Health insurance provider",
      "input_type": "text",
      "instructions_en": "Name of your statutory (gesetzliche) or private (private) German health insurance provider. You must have insurance from Day 1 of your stay — the Ausländerbehörde will refuse the application otherwise.",
      "common_mistakes": ["Declaring a foreign insurance as coverage — Germany only accepts domestic insurers or approved international plans", "Applying before activating the insurance"],
      "example_value": "Techniker Krankenkasse",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "prior_germany_stays",
      "label_de": "Frühere Aufenthalte in Deutschland",
      "label_en": "Prior stays in Germany (if any)",
      "input_type": "text",
      "instructions_en": "List any previous stays longer than 90 days, with dates and purpose. Short tourist trips under 90 days don't need to be listed. If no prior long stay, write 'keine' (none).",
      "common_mistakes": ["Omitting a previous long stay — the Ausländerbehörde has access to the record", "Listing every short tourist trip"],
      "example_value": "keine",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "criminal_record_declaration",
      "label_de": "Straftaten/Ermittlungen",
      "label_en": "Criminal record self-declaration",
      "input_type": "checkbox",
      "instructions_en": "Check ONLY if you have NOT been convicted of a crime or subject to a pending criminal investigation in any country. A false declaration is itself a criminal offence that will trigger deportation.",
      "common_mistakes": ["Checking despite an old minor conviction (always declare)", "Not declaring pending investigations from abroad — the ABH checks Interpol records"],
      "example_value": "true",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "family_members_included",
      "label_de": "Familienangehörige im Antrag",
      "label_en": "Family members included in this application",
      "input_type": "text",
      "instructions_en": "If you are applying alongside a spouse or minor children, list their full names and passport numbers. Each adult family member also needs their own form. Leave blank if applying alone.",
      "common_mistakes": ["Including adult children as dependants — they need their own separate application", "Omitting a minor child who accompanied you on entry"],
      "example_value": "",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "requested_permit_duration_months",
      "label_de": "Beantragte Aufenthaltsdauer (Monate)",
      "label_en": "Requested permit duration (months)",
      "input_type": "number",
      "instructions_en": "Duration of the residence permit you are requesting, in months. Student permits are typically 24 months initial. Work permits align with employment contract length, max 48 months. The ABH may issue a shorter permit than requested.",
      "common_mistakes": ["Requesting a length longer than the passport validity minus 6 months", "Requesting less than 12 months when you're entitled to more"],
      "example_value": "24",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "signature_date",
      "label_de": "Ort, Datum, Unterschrift",
      "label_en": "Place, date, signature",
      "input_type": "date",
      "instructions_en": "Date you are signing this application. Must be within 14 days of your appointment — older forms may be rejected.",
      "common_mistakes": ["Signing more than 14 days before the appointment", "Forgetting the place name"],
      "example_value": "2026-04-16",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_signing",
      "label_de": "Ort der Unterschrift",
      "label_en": "Place of signing",
      "input_type": "text",
      "instructions_en": "City where you are signing the form. Usually your residence city.",
      "common_mistakes": ["Writing 'Germany' or your country of origin"],
      "example_value": "München",
      "required": true,
      "ai_can_explain": false
    }
  ]
  $FIELDS$::jsonb,
  'https://stadt.muenchen.de/service/suche/aufenthaltstitel/',
  '2026-04-16'
)
ON CONFLICT (form_code) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  bundeslaender = EXCLUDED.bundeslaender,
  visa_types = EXCLUDED.visa_types,
  related_step_slug = EXCLUDED.related_step_slug,
  fields = EXCLUDED.fields,
  download_url = EXCLUDED.download_url,
  verified_at = EXCLUDED.verified_at;

-- ============================================================================
-- FORM 4: Aufenthaltstitel (Berlin / same AA4 federal template)
-- ============================================================================

INSERT INTO public.forms (form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, fields, download_url, verified_at)
VALUES (
  'aufenthaltstitel_de_be',
  'Antrag auf Erteilung eines Aufenthaltstitels (Berlin)',
  'Residence Permit Application (Berlin)',
  ARRAY['DE-BE'],
  ARRAY['student','work','job_seeker','family','freelance'],
  'residence_permit_be',
  $FIELDS$
  [
    {
      "field_id": "last_name",
      "label_de": "Familienname",
      "label_en": "Last name",
      "input_type": "text",
      "instructions_en": "Exactly as on the passport MRZ. Berlin LEA rejects applications with any spelling mismatch.",
      "common_mistakes": ["Latinised form that doesn't match the MRZ", "Omitting 'Jr.' / 'Sr.' shown on the passport"],
      "example_value": "Müller",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "first_names",
      "label_de": "Vornamen",
      "label_en": "First names (all given names)",
      "input_type": "text",
      "instructions_en": "Every given name from the passport in order, space-separated.",
      "common_mistakes": ["Entering only the preferred name", "Swapping middle-name order"],
      "example_value": "Anna Maria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "birth_name",
      "label_de": "Geburtsname",
      "label_en": "Birth name (if different)",
      "input_type": "text",
      "instructions_en": "Only required if different from current family name.",
      "common_mistakes": ["Repeating the last name", "Writing 'n/a'"],
      "example_value": "",
      "required": false,
      "ai_can_explain": false
    },
    {
      "field_id": "date_of_birth",
      "label_de": "Geburtsdatum",
      "label_en": "Date of birth",
      "input_type": "date",
      "instructions_en": "From the passport MRZ. DD.MM.YYYY on paper form.",
      "common_mistakes": ["MM/DD/YYYY format"],
      "example_value": "1998-05-14",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_birth",
      "label_de": "Geburtsort und -land",
      "label_en": "Place of birth (city, country)",
      "input_type": "text",
      "instructions_en": "City and country as printed on the passport.",
      "common_mistakes": ["Country only", "Historical country names"],
      "example_value": "Lagos, Nigeria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "nationality",
      "label_de": "Staatsangehörigkeit",
      "label_en": "Nationality",
      "input_type": "text",
      "instructions_en": "Every nationality you currently hold. All must be declared.",
      "common_mistakes": ["Omitting a dormant nationality", "Using 'EU' as a nationality"],
      "example_value": "Nigerian",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "marital_status",
      "label_de": "Familienstand",
      "label_en": "Marital status",
      "input_type": "select",
      "instructions_en": "Current civil status. Foreign marriages must be legally recognised; religious-only ceremonies count as 'ledig'.",
      "common_mistakes": ["Declaring religious marriage as civil", "Declaring 'geschieden' before decree is final"],
      "example_value": "ledig",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "passport_number",
      "label_de": "Passnummer",
      "label_en": "Passport number",
      "input_type": "text",
      "instructions_en": "Exactly as printed including leading zeros.",
      "common_mistakes": ["Dropping leading zeros", "Confusing document number with personal ID"],
      "example_value": "A12345678",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "passport_issue_date",
      "label_de": "Ausstellungsdatum Pass",
      "label_en": "Passport issue date",
      "input_type": "date",
      "instructions_en": "Date the passport was issued.",
      "common_mistakes": ["Using visa-from date", "Confusing with expiry"],
      "example_value": "2022-01-20",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "passport_expiry_date",
      "label_de": "Gültig bis",
      "label_en": "Passport expiry date",
      "input_type": "date",
      "instructions_en": "Must be valid at least 6 months beyond requested permit period. Otherwise permit is shortened.",
      "common_mistakes": ["Applying with passport expiring in under 12 months", "Confusing with issue date"],
      "example_value": "2032-01-20",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "passport_issuing_authority",
      "label_de": "Ausstellende Behörde",
      "label_en": "Passport issuing authority",
      "input_type": "text",
      "instructions_en": "The authority on the passport — typically the country's immigration or foreign affairs ministry.",
      "common_mistakes": ["Writing the embassy abroad instead"],
      "example_value": "Nigeria Immigration Service",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "current_address_in_germany",
      "label_de": "Wohnanschrift in Deutschland",
      "label_en": "Current address in Germany",
      "input_type": "text",
      "instructions_en": "Registered address from the Anmeldung. LEA Berlin verifies against Meldebescheinigung — complete Anmeldung first.",
      "common_mistakes": ["Applying before Anmeldung", "Different from Meldebescheinigung"],
      "example_value": "Friedrichstraße 110, 10117 Berlin",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "residence_purpose",
      "label_de": "Aufenthaltszweck",
      "label_en": "Purpose of stay",
      "input_type": "select",
      "instructions_en": "Category matching the residence permit you're applying for. Must match the entry visa — changing purpose mid-application requires justification and may delay by weeks.",
      "common_mistakes": ["Changing purpose without discussion", "'Employment' while on student visa without work permit"],
      "example_value": "Studium",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "entry_date",
      "label_de": "Einreisedatum",
      "label_en": "Entry date into Germany",
      "input_type": "date",
      "instructions_en": "Date of last entry — the stamp date in the passport, not any previous visit.",
      "common_mistakes": ["Using a previous visit's date", "Guessing"],
      "example_value": "2026-03-15",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "entry_visa_type",
      "label_de": "Visum bei Einreise",
      "label_en": "Visa held at entry",
      "input_type": "text",
      "instructions_en": "The type on the visa label — look at 'TYPE' line (e.g. D-Visum zum Studium, Schengen C-Visum).",
      "common_mistakes": ["General purpose instead of label text", "Confusing Schengen C and National D"],
      "example_value": "D-Visum zum Studium",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "employer_or_university_name",
      "label_de": "Arbeitgeber / Hochschule",
      "label_en": "Employer or university name",
      "input_type": "text",
      "instructions_en": "Full legal name of employer or university as on the admission/employment letter.",
      "common_mistakes": ["Abbreviations / informal names", "Faculty name instead of university"],
      "example_value": "Humboldt-Universität zu Berlin",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "employer_address",
      "label_de": "Anschrift Arbeitgeber/Hochschule",
      "label_en": "Employer or university address",
      "input_type": "text",
      "instructions_en": "Official postal address of the employer/university, not the workplace building.",
      "common_mistakes": ["Building you physically work at", "HR dept. address"],
      "example_value": "Unter den Linden 6, 10117 Berlin",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "monthly_income_eur",
      "label_de": "Einkommen pro Monat (EUR)",
      "label_en": "Monthly gross income in EUR",
      "input_type": "number",
      "instructions_en": "Gross monthly income. For students: monthly Sperrkonto disbursement OR parental support OR scholarship — not total amount. For workers: contract amount, not net.",
      "common_mistakes": ["Annual instead of monthly", "Net instead of gross", "Students: full Sperrkonto balance"],
      "example_value": "1091",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "health_insurance_provider",
      "label_de": "Krankenversicherung",
      "label_en": "Health insurance provider",
      "input_type": "text",
      "instructions_en": "German statutory (gesetzlich) or private (privat) provider. Coverage from Day 1 is mandatory. LEA refuses applications otherwise.",
      "common_mistakes": ["Declaring a foreign insurance — only German or approved international plans accepted", "Applying before activation"],
      "example_value": "Techniker Krankenkasse",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "prior_germany_stays",
      "label_de": "Frühere Aufenthalte in Deutschland",
      "label_en": "Prior stays in Germany",
      "input_type": "text",
      "instructions_en": "Previous stays over 90 days, with dates and purpose. Short trips under 90 days don't count. If none, write 'keine'.",
      "common_mistakes": ["Omitting a previous long stay — LEA has access to records", "Listing every short tourist trip"],
      "example_value": "keine",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "criminal_record_declaration",
      "label_de": "Straftaten/Ermittlungen",
      "label_en": "Criminal record self-declaration",
      "input_type": "checkbox",
      "instructions_en": "Check ONLY if you have no convictions or pending investigations anywhere. False declarations are themselves criminal offences leading to deportation.",
      "common_mistakes": ["Checking despite old minor conviction", "Not declaring pending foreign investigations"],
      "example_value": "true",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "family_members_included",
      "label_de": "Familienangehörige im Antrag",
      "label_en": "Family members included in this application",
      "input_type": "text",
      "instructions_en": "Spouse + minor children only. Each adult family member needs their own form. Leave blank if applying alone.",
      "common_mistakes": ["Including adult children", "Omitting minor children who entered with you"],
      "example_value": "",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "requested_permit_duration_months",
      "label_de": "Beantragte Aufenthaltsdauer (Monate)",
      "label_en": "Requested permit duration (months)",
      "input_type": "number",
      "instructions_en": "Student permits typically 24 months initial. Work permits align with contract length, max 48 months. LEA may issue shorter than requested.",
      "common_mistakes": ["Exceeding passport validity minus 6 months", "Requesting less than entitled"],
      "example_value": "24",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "signature_date",
      "label_de": "Datum der Unterschrift",
      "label_en": "Date of signature",
      "input_type": "date",
      "instructions_en": "Within 14 days of the appointment. Older forms may be rejected.",
      "common_mistakes": ["Signing too early", "Forgetting the place"],
      "example_value": "2026-04-16",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "place_of_signing",
      "label_de": "Ort der Unterschrift",
      "label_en": "Place of signing",
      "input_type": "text",
      "instructions_en": "City where you sign — typically your residence city.",
      "common_mistakes": ["Writing 'Germany'"],
      "example_value": "Berlin",
      "required": true,
      "ai_can_explain": false
    }
  ]
  $FIELDS$::jsonb,
  'https://service.berlin.de/dienstleistung/120686/',
  '2026-04-16'
)
ON CONFLICT (form_code) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  bundeslaender = EXCLUDED.bundeslaender,
  visa_types = EXCLUDED.visa_types,
  related_step_slug = EXCLUDED.related_step_slug,
  fields = EXCLUDED.fields,
  download_url = EXCLUDED.download_url,
  verified_at = EXCLUDED.verified_at;

-- ============================================================================
-- FORM 5: Student health insurance enrollment (national, TK / DAK common template)
-- ============================================================================

INSERT INTO public.forms (form_code, name_de, name_en, bundeslaender, visa_types, related_step_slug, fields, download_url, verified_at)
VALUES (
  'krankenversicherung_student',
  'Studentische Krankenversicherung (Anmeldung)',
  'Student Health Insurance Enrollment',
  '{}',
  ARRAY['student'],
  'health_insurance',
  $FIELDS$
  [
    {
      "field_id": "last_name",
      "label_de": "Familienname",
      "label_en": "Last name",
      "input_type": "text",
      "instructions_en": "As on your passport — must match the Immatrikulationsbescheinigung (matriculation certificate).",
      "common_mistakes": ["Spelling mismatch between passport and university record"],
      "example_value": "Müller",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "first_names",
      "label_de": "Vornamen",
      "label_en": "First names",
      "input_type": "text",
      "instructions_en": "All given names as on the passport.",
      "common_mistakes": ["Using only the preferred name"],
      "example_value": "Anna Maria",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "date_of_birth",
      "label_de": "Geburtsdatum",
      "label_en": "Date of birth",
      "input_type": "date",
      "instructions_en": "From the passport.",
      "common_mistakes": ["MM/DD/YYYY instead of DD.MM.YYYY on paper"],
      "example_value": "1998-05-14",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "university_name",
      "label_de": "Hochschule",
      "label_en": "University name",
      "input_type": "text",
      "instructions_en": "Full legal name of the university as on the admission/matriculation certificate.",
      "common_mistakes": ["Abbreviated form", "Faculty name instead of university"],
      "example_value": "Ludwig-Maximilians-Universität München",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "matriculation_number",
      "label_de": "Matrikelnummer",
      "label_en": "Matriculation number",
      "input_type": "text",
      "instructions_en": "The student ID number from your matriculation certificate. If you haven't matriculated yet, check the 'Vorläufige Immatrikulation' option.",
      "common_mistakes": ["Using the application number instead of the Matrikelnummer", "Leaving blank before matriculation — use 'Vorläufige Immatrikulation' box"],
      "example_value": "12345678",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "semester_start_date",
      "label_de": "Semesterbeginn",
      "label_en": "Semester start date",
      "input_type": "date",
      "instructions_en": "The official start of your first semester. Health insurance must be active from this date — backdating is not possible, so apply at least 4 weeks before.",
      "common_mistakes": ["Using the date lectures start instead of the formal semester start (which is usually earlier)", "Applying less than 2 weeks before semester start — card may not arrive in time"],
      "example_value": "2026-10-01",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "previous_insurance_provider",
      "label_de": "Bisherige Versicherung (falls vorhanden)",
      "label_en": "Previous health insurance (if any)",
      "input_type": "text",
      "instructions_en": "If switching from another German statutory insurer, write the name. If coming from abroad or no prior insurance, leave blank.",
      "common_mistakes": ["Writing foreign insurance details here — that's a separate transfer process", "Leaving blank when you do have prior German insurance — can cause double billing"],
      "example_value": "",
      "required": false,
      "ai_can_explain": true
    },
    {
      "field_id": "iban",
      "label_de": "IBAN",
      "label_en": "German IBAN for monthly payment",
      "input_type": "text",
      "instructions_en": "Your German bank IBAN for the ~€120/month SEPA direct debit. Must be a German account (DE...) — foreign IBANs not accepted for student tariff.",
      "common_mistakes": ["Using a foreign IBAN", "Leaving blank — the insurer needs a payment method from Day 1"],
      "example_value": "DE89 3704 0044 0532 0130 00",
      "required": true,
      "ai_can_explain": true
    },
    {
      "field_id": "address_in_germany",
      "label_de": "Adresse in Deutschland",
      "label_en": "Address in Germany",
      "input_type": "text",
      "instructions_en": "Your registered address (from Anmeldung). The insurer sends the insurance card here.",
      "common_mistakes": ["Using a c/o address that can't accept registered mail"],
      "example_value": "Kaulbachstraße 45, 80539 München",
      "required": true,
      "ai_can_explain": false
    },
    {
      "field_id": "signature_date",
      "label_de": "Datum, Unterschrift",
      "label_en": "Date of signature",
      "input_type": "date",
      "instructions_en": "Date you submit the enrollment. Coverage typically starts on the semester start date OR submission date, whichever is later.",
      "common_mistakes": ["Post-dating to try to start coverage earlier — not possible"],
      "example_value": "2026-04-16",
      "required": true,
      "ai_can_explain": false
    }
  ]
  $FIELDS$::jsonb,
  'https://www.tk.de/',
  '2026-04-16'
)
ON CONFLICT (form_code) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  name_en = EXCLUDED.name_en,
  bundeslaender = EXCLUDED.bundeslaender,
  visa_types = EXCLUDED.visa_types,
  related_step_slug = EXCLUDED.related_step_slug,
  fields = EXCLUDED.fields,
  download_url = EXCLUDED.download_url,
  verified_at = EXCLUDED.verified_at;
