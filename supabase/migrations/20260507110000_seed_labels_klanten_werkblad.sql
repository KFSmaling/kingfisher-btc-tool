-- ============================================================
-- Stap 11.D — Labels-seed Klanten & Dienstverlening werkblad
--
-- Platform-eis #2 (PLATFORM_REQUIREMENTS.md): alle UI-strings via
-- appLabel("label.klanten.<context>.<naam>", fallback) + seed-migratie
-- met category='label'. Format-anker: 20260421090000_seed_labels.sql.
--
-- Naming-convention: label.klanten.<sectie>.<element>
--
-- Tenant_overridable: default false (admin-UI overschrijft via
-- tenant_id-rij volgens ADR-002 niveau 1).
--
-- Idempotent: ON CONFLICT (key) DO NOTHING — bestaande rij blijft.
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES

  -- Werkblad-titel + sectie-koppen
  ('label.klanten.werkblad.titel',     'label', 'Naam Klanten & Dienstverlening werkblad', 'Klanten & Dienstverlening'),
  ('label.klanten.section.werkruimte', 'label', 'Toggle-label werkruimte-view',             'Werkruimte'),
  ('label.klanten.section.rapport',    'label', 'Toggle-label rapport-view',                'Rapport'),

  -- Fase-tabs
  ('label.klanten.fase.1.titel',         'label', 'Fase-tab 1', 'Inventarisatie'),
  ('label.klanten.fase.2.titel',         'label', 'Fase-tab 2', 'Pijnpunten'),
  ('label.klanten.fase.3.titel',         'label', 'Fase-tab 3', 'Analyse'),
  ('label.klanten.fase.4.titel',         'label', 'Fase-tab 4', 'Verbeterrichtingen'),
  ('label.klanten.fase.disabled.tooltip','label', 'Tooltip op disabled fase-tabs', 'komt in latere sprint'),

  -- Dimensie-archetype-koppen (drie MVP-archetypes)
  ('label.klanten.dimensie.klantsegment', 'label', 'Default kop voor klantsegment-dimensie', 'Klantsegmenten'),
  ('label.klanten.dimensie.propositie',   'label', 'Default kop voor propositie-dimensie',   'Proposities'),
  ('label.klanten.dimensie.kanaal',       'label', 'Default kop voor kanaal-dimensie',       'Kanalen'),

  -- Archetype-veld-labels — klantsegment
  ('label.klanten.veld.klantsegment.omvang',             'label', 'Veld omvang',             'Omvang'),
  ('label.klanten.veld.klantsegment.strategisch_belang', 'label', 'Veld strategisch belang', 'Strategisch belang'),
  ('label.klanten.veld.klantsegment.karakteristieken',   'label', 'Veld karakteristieken',   'Karakteristieken'),
  ('label.klanten.veld.klantsegment.behoeften',          'label', 'Veld behoeften',          'Behoeften'),

  -- Archetype-veld-labels — propositie
  ('label.klanten.veld.propositie.differentiatie',        'label', 'Veld differentiatie',        'Differentiatie'),
  ('label.klanten.veld.propositie.prijsstelling',         'label', 'Veld prijsstelling',         'Prijsstelling'),
  ('label.klanten.veld.propositie.levensfase',            'label', 'Veld levensfase',            'Levensfase'),
  ('label.klanten.veld.propositie.concurrentiepositie',   'label', 'Veld concurrentiepositie (optioneel)', 'Concurrentiepositie'),

  -- Archetype-veld-labels — kanaal
  ('label.klanten.veld.kanaal.type',     'label', 'Veld kanaal-type',  'Type'),
  ('label.klanten.veld.kanaal.bereik',   'label', 'Veld bereik',       'Bereik'),
  ('label.klanten.veld.kanaal.ervaring', 'label', 'Veld ervaring',     'Ervaring'),
  ('label.klanten.veld.kanaal.economie', 'label', 'Veld economie',     'Economie'),

  -- Modal-titels
  ('label.klanten.modal.item.titel.add',  'label', 'Modal-titel nieuw item',     'Nieuw item'),
  ('label.klanten.modal.item.titel.edit', 'label', 'Modal-titel item bewerken', 'Item bewerken'),

  -- Knoppen
  ('label.klanten.knop.dimensie.toevoegen', 'label', 'Knop nieuwe dimensie',         '+ dimensie'),
  ('label.klanten.knop.item.toevoegen',     'label', 'Knop nieuw item',              '+ item'),
  ('label.klanten.knop.item.opslaan',       'label', 'Knop opslaan in modal',        'Opslaan'),
  ('label.klanten.knop.item.annuleren',     'label', 'Knop annuleren in modal',      'Annuleren'),

  -- Rapport-laag
  ('label.klanten.rapport.titel',                 'label', 'Rapport-laag titel',                          'Klanten & Dienstverlening — overzicht'),
  ('label.klanten.rapport.section.samenvatting',  'label', 'Rapport-sectie samenvatting',                'Samenvatting'),
  ('label.klanten.rapport.section.huidig',        'label', 'Rapport-sectie huidige situatie',            'Huidige situatie'),
  ('label.klanten.rapport.section.patronen',      'label', 'Rapport-sectie patronen (placeholder MVP)', 'Patronen'),
  ('label.klanten.rapport.section.richtingen',    'label', 'Rapport-sectie richtingen (placeholder MVP)', 'Verbeterrichtingen'),
  ('label.klanten.rapport.knop.print',            'label', 'Print-knop in rapport-header',               'PDF / Printen'),

  -- AI-affordance-knop-teksten (zichtbaar maar disabled in MVP)
  ('label.klanten.ai.cluster',          'label', 'AI-knop cluster-analyse',          'Cluster-analyse'),
  ('label.klanten.ai.paradox',          'label', 'AI-knop paradox-detectie',         'Paradox-detectie'),
  ('label.klanten.ai.positionering',    'label', 'AI-knop positionering-analyse',    'Positionering'),
  ('label.klanten.ai.overstijgend',     'label', 'AI-knop overstijgend-patroon',     'Overstijgend'),
  ('label.klanten.ai.disabled.tooltip', 'label', 'Tooltip op disabled AI-knoppen',   'AI komt in fase 3'),

  -- Helper-teksten (uit prototype)
  ('label.klanten.helper.iteratief',         'label', 'Helper iteratief werken',                'werk in uitvoering — geen ''klaar'' status'),
  ('label.klanten.helper.fase.geen_volgorde','label', 'Helper geen verplichte volgorde',         'geen verplichte volgorde')

ON CONFLICT (tenant_id, key) DO NOTHING;
