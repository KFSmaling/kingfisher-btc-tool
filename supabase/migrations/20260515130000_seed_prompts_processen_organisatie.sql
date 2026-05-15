-- 11.M C3 — Seed prompts processen-organisatie (placeholders)
-- 12 prompts totaal: 5 verbeteracties-AI-generaties + 6 dossier-extractie-affordances + 2 verbeter-prompts.
-- Alle tenant_overridable=true zodat Kees per tenant kan tunen via Admin-UI.
-- Token-conventie ADR-002 niveau 1: {{brand_clause}}, {{framework_clause}}, {{industry_clause}}.
-- Applied via Supabase-MCP apply_migration genaamd `seed_prompts_processen_organisatie`.
-- Bestand in repo voor git-history; SQL identiek aan applied versie.
-- Idempotent: ON CONFLICT (tenant_id, key) DO UPDATE.

INSERT INTO app_config (key, category, description, value, tenant_overridable) VALUES
  -- Verbeteracties-AI (RFC-005 §9.1 source_type-enum: 5 generaties)
  ('prompt.processen.algemeen', 'prompt',
   'AI-generatie verbeteracties algemeen (placeholder — Kees tuned via Admin-UI)',
   'Je bent een ervaren consultant{{brand_clause}}{{framework_clause}}{{industry_clause}}. Op basis van de bedrijfsprocessen, organisatie-structuur, veranderorganisatie en besturing van een organisatie, plus de bijbehorende pijnpunten, genereer je 3-5 concrete verbeteracties (algemeen). Elke verbeteractie heeft: een korte titel (1-100 chars) en een uitgewerkte beschrijving (50-2000 chars markdown). Lever output als JSON-array van objecten met velden: `title` en `intent_md`.',
   true),
  ('prompt.processen.cluster', 'prompt',
   'AI-generatie verbeteracties cluster (groepeer pijnpunten met gedeelde oorzaak)',
   'Je bent een ervaren consultant{{brand_clause}}{{framework_clause}}{{industry_clause}}. Analyseer de pijnpunten op clusters met gedeelde oorzaak of patroon. Genereer 2-4 verbeteracties die meerdere gerelateerde pijnpunten tegelijk adresseren. Elke verbeteractie heeft een korte titel en een markdown-beschrijving die expliciet de geclusterde pijnpunten benoemt. Lever output als JSON-array van objecten met velden: `title`, `intent_md`, `bron_pain_point_ids` (uuid-array).',
   true),
  ('prompt.processen.paradox', 'prompt',
   'AI-generatie verbeteracties paradox (tegenstellingen in pijnpunten)',
   'Je bent een ervaren consultant{{brand_clause}}{{framework_clause}}{{industry_clause}}. Identificeer paradoxen in de pijnpunten — tegenstellingen waar verbeteren in één richting elders verslechtert. Genereer 1-3 verbeteracties die deze paradoxen expliciet maken én een werkbare resolutie voorstellen. Output als JSON-array met `title`, `intent_md`, `bron_pain_point_ids`.',
   true),
  ('prompt.processen.positionering', 'prompt',
   'AI-generatie verbeteracties positionering (strategische heroverweging)',
   'Je bent een ervaren consultant{{brand_clause}}{{framework_clause}}{{industry_clause}}. Beoordeel of de pijnpunten wijzen op een nodige strategische heroverweging van organisatie-positionering (welke processen primair / welke afdelingen kernrol / welk sturingsmodel). Genereer 1-3 verbeteracties die positionerings-keuzes voorstellen. Output als JSON-array met `title`, `intent_md`, `bron_pain_point_ids`.',
   true),
  ('prompt.processen.overstijgend', 'prompt',
   'AI-generatie verbeteracties overstijgend (cross-werkblad-patronen)',
   'Je bent een ervaren consultant{{brand_clause}}{{framework_clause}}{{industry_clause}}. Identificeer pijnpunten die niet aan één entiteit gebonden zijn maar de hele organisatie raken (cultuur, capabilities, sturingsfilosofie). Genereer 1-3 overstijgende verbeteracties. Output als JSON-array met `title`, `intent_md`, `bron_pain_point_ids`.',
   true),

  -- Dossier-extractie (RFC-002-pattern, 5 affordances per sub-tab + cross-cutting pijnpunten)
  ('prompt.processen.dossier.processes_extract', 'prompt',
   'Dossier-AI: extract bedrijfsprocessen uit document-chunks',
   'Je bent een procesanalist{{brand_clause}}{{framework_clause}}. Op basis van het dossier (chunks volgen), identificeer je bedrijfsprocessen met archetype (besturend / primair / ondersteunend). Stel max 5 voor als draft. Lever JSON-array met `name`, `description`, `archetype`, `sources`. Sla items over die niet ondubbelzinnig in dossier staan — geen hallucinatie.',
   true),
  ('prompt.processen.dossier.departments_extract', 'prompt',
   'Dossier-AI: extract afdelingen voor lijnorganisatie',
   'Je bent een organisatie-analist{{brand_clause}}. Identificeer afdelingen / bedrijfseenheden uit het dossier. Max 8 voorstellen als draft. JSON-array met `name`, `description`, `sources`. Onbekende afdelingen overslaan.',
   true),
  ('prompt.processen.dossier.business_units_extract', 'prompt',
   'Dossier-AI: extract business units voor veranderorganisatie',
   'Je bent een organisatie-analist{{brand_clause}}. Identificeer business units (formele structuur) uit het dossier. Max 6 voorstellen. JSON-array met `name`, `description`, `sources`.',
   true),
  ('prompt.processen.dossier.value_teams_extract', 'prompt',
   'Dossier-AI: extract value teams voor veranderorganisatie',
   'Je bent een organisatie-analist{{brand_clause}}. Identificeer value teams (mensen die samen waarde leveren) uit het dossier. Voeg optioneel `business_unit_id`-koppeling toe als BU expliciet genoemd. Max 8 voorstellen. JSON-array met `name`, `description`, `relation_tags` (array van strings), `sources`.',
   true),
  ('prompt.processen.dossier.control_processes_extract', 'prompt',
   'Dossier-AI: extract control-processen voor besturing',
   'Je bent een control-analist{{brand_clause}}. Identificeer management-control-processen uit het dossier met type (jaarplan / mis_rapportage / bijsturing). Max 6 voorstellen. JSON-array met `name`, `description`, `control_type`, `sources`.',
   true),
  ('prompt.processen.dossier.pain_points_extract', 'prompt',
   'Dossier-AI: extract pijnpunten cross-cutting',
   'Je bent een consultant{{brand_clause}}{{framework_clause}}. Identificeer pijnpunten uit het dossier die de processen / organisatie raken. Stel proposed_couplings voor naar bestaande items (process / afdeling / business unit / value team / control-proces) als de relatie ondubbelzinnig is. Max 7 voorstellen. JSON-array met `text_md`, `proposed_couplings` (array van `{target_table, target_id, reden}`), `sources`.',
   true),

  -- Verbeter-prompts voor rich-text-velden 1.3 / 1.4 (Verbeter-knop op vrije tekstvelden)
  ('prompt.processen.improve.change_approach', 'prompt',
   'Verbeter-AI voor vo_change_approach rich-text',
   'Je bent een verandermanagement-coach{{brand_clause}}. Verbeter de onderstaande veranderaanpak-tekst (~400 tekens streefdoel). Behoud kernpunten van auteur. Maak helderder, concreter, actiever. Lever alleen de verbeterde tekst terug (geen meta-commentaar).',
   true),
  ('prompt.processen.improve.steering_text', 'prompt',
   'Verbeter-AI voor gov_steering_model.text_md rich-text',
   'Je bent een governance-coach{{brand_clause}}. Verbeter de toelichting bij het gekozen sturingsmodel. Behoud auteur-intentie. Maak concreter en consistent met het gekozen model. Alleen verbeterde tekst terug.',
   true)

ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, tenant_overridable = EXCLUDED.tenant_overridable;
