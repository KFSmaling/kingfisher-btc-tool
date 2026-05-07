-- ============================================================
-- Stap 11.E correctie — labels-seed voor DimensieCreateModal
--
-- Aanvulling op 20260507110000_seed_labels_klanten_werkblad.sql met
-- ~10 keys voor dimensie-create-modal + lege-state-CTA in WerkruimteView.
--
-- Naming: label.klanten.dimensie.create.* + label.klanten.archetype.*
-- + label.klanten.knop.dimensie.toevoegen.eerste (lege-state CTA).
--
-- Idempotent via ON CONFLICT (tenant_id, key) DO NOTHING.
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES
  -- Lege-state CTA in WerkruimteView
  ('label.klanten.knop.dimensie.toevoegen.eerste', 'label', 'CTA-knop in lege-state werkruimte', '+ Eerste dimensie aanmaken'),

  -- DimensieCreateModal — kop + velden
  ('label.klanten.dimensie.create.titel',          'label', 'Modal-titel nieuwe dimensie',                        'Nieuwe dimensie'),
  ('label.klanten.dimensie.create.archetype.label','label', 'Veld-label archetype-dropdown',                      'Archetype'),
  ('label.klanten.dimensie.create.archetype.placeholder','label','Placeholder archetype-dropdown',                'Kies een archetype…'),
  ('label.klanten.dimensie.create.naam.label',     'label', 'Veld-label naam-input',                              'Naam'),
  ('label.klanten.dimensie.create.naam.placeholder','label','Placeholder voor naam-veld (generiek)',              'bijv. Klantsegmenten of Doelgroepen'),
  ('label.klanten.dimensie.create.omschrijving.label','label','Veld-label omschrijving (optioneel)',              'Omschrijving (optioneel)'),
  ('label.klanten.dimensie.create.omschrijving.placeholder','label','Placeholder omschrijving',                   'korte tenant-beschrijving van deze dimensie'),

  -- Validatie-meldingen
  ('label.klanten.dimensie.create.error.naam_leeg', 'label', 'Inline error bij lege naam',                        'Naam is verplicht'),

  -- Tooltips voor disabled archetype-opties
  ('label.klanten.archetype.disabled.tooltip', 'label', 'Tooltip op disabled archetype-opties', 'komt in latere sprint')
ON CONFLICT (tenant_id, key) DO NOTHING;
