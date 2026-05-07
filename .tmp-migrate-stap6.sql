-- ============================================================
-- Bundeled handmatige migratie — stap 6 seed-migraties
--
-- Datum:   2026-05-03
-- Doel:    drie nieuwe app_config-prompts seeden die niet via CI
--          zijn geapplied (Supabase-migrations workflow gefaald op
--          missing SUPABASE_ACCESS_TOKEN — zie .builder-result.md
--          eerdere afronding).
--
-- Idempotent: alle drie INSERTs gebruiken ON CONFLICT (key) DO NOTHING.
-- Mag opnieuw worden gerund — bestaande rijen blijven onaangeroerd.
--
-- Instructies:
--   1. Open Supabase Dashboard → SQL Editor
--      (project lsaljhnxclldlyocunqf)
--   2. Plak de volledige inhoud van dit bestand
--   3. Klik Run
--   4. Verifieer met deze query dat 3 rijen bestaan:
--
--        SELECT key, category, length(value) AS value_chars, updated_at
--        FROM app_config
--        WHERE key IN (
--          'prompt.guideline.link_themes',
--          'prompt.magic.system_general_knowledge',
--          'prompt.strategy.samenvatting'
--        )
--        ORDER BY key;
--
--      Verwacht: 3 rijen, category='prompt'.
--
-- Bronbestanden (overgenomen 1-op-1):
--   supabase/migrations/20260503000000_seed_prompt_guideline_link_themes.sql
--   supabase/migrations/20260503000100_seed_prompt_magic_system_general_knowledge.sql
--   supabase/migrations/20260503000200_seed_prompt_strategy_samenvatting.sql
-- ============================================================


-- ─── 1/3 ──────────────────────────────────────────────────────
-- ============================================================
-- Stap 6a — Seed prompt.guideline.link_themes
--
-- Sluit het admin-aanpasbaarheid-gat voor de Auto-link-knop in het
-- Richtlijnen-werkblad (audit fase 1 A.1, fase 2 S-5).
--
-- Tekst is 1-op-1 overgenomen uit api/guidelines.js linkThemes()
-- hardcoded fallback. Templating naar BTC/KF-vrij volgt in stap 7
-- (ADR-002 niveau 1).
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES
('prompt.guideline.link_themes', 'prompt', 'Auto-link-knop in Richtlijnen-werkblad — koppelt principes aan strategische thema''s op basis van inhoudelijke relevantie',
$$Je koppelt Leidende Principes aan Strategische Thema's op basis van inhoudelijke relevantie.

REGELS:
- Koppel ALLEEN bij een duidelijke, directe inhoudelijke relatie
- Bij twijfel of een zwakke relatie: geen koppeling — lege array
- Een principe kan aan meerdere thema's gekoppeld worden (max 3)
- Niet elk principe hoeft een koppeling te krijgen
- Gebruik uitsluitend de index-nummers uit de lijsten

OUTPUT: Exact JSON — één entry per principe (ook als de array leeg is):
{"links":{"<principe-index>":[<thema-index>, ...]}}$$
)
ON CONFLICT (key) DO NOTHING;

-- ─── 2/3 ──────────────────────────────────────────────────────
-- ============================================================
-- Stap 6b — Seed prompt.magic.system_general_knowledge
--
-- Sluit het admin-aanpasbaarheid-gat voor de Magic-Staff-modus
-- "geen Dossier" fallback (audit fase 1 A.1, fase 2 S-5 + IP-6).
--
-- Tekst is 1-op-1 overgenomen uit api/magic.js SYSTEM_GENERAL_KNOWLEDGE
-- constant. Bevat nog "Kingfisher & Partners" — generaliseren volgt in
-- stap 7 (ADR-002 niveau 1).
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES
('prompt.magic.system_general_knowledge', 'prompt', 'Magic Staff system-prompt voor general-knowledge-modus (gebruikt wanneer Het Dossier leeg of onvoldoende is — Haiku-model)',
$$Je bent een Senior Strategie Consultant bij Kingfisher & Partners, gespecialiseerd in business transformatie.

Het Dossier bevat onvoldoende informatie voor dit veld. Genereer op basis van jouw brede kennis van businessstrategie, marktdynamiek en sectortrends een gefundeerd voorstel.

WERKWIJZE:
1. Baseer je voorstel op algemeen erkende strategische inzichten, best practices en actuele markttrends.
2. Wees specifiek en praktisch — geen vage generalisaties.
3. Geef items die als startpunt dienen voor verdere verdieping door de consultant.
4. Geen preamble of uitleg — alleen het voorstel zelf.
5. Bij lijstvelden: één item per regel, zonder nummering, bullets of streepjes.
6. Maximaal 8 items.$$
)
ON CONFLICT (key) DO NOTHING;

-- ─── 3/3 ──────────────────────────────────────────────────────
-- ============================================================
-- Stap 6c — Seed prompt.strategy.samenvatting
--
-- Sluit het admin-aanpasbaarheid-gat voor de "Genereer Samenvatting"-knop
-- in het Strategie-werkblad (audit fase 1 A.1, fase 2 S-5).
--
-- Code-pad was al correct:
--   - api/strategy.js generateSamenvatting heeft systemOverride-parameter
--   - StrategieWerkblad.jsx stuurt systemPromptSamenvatting al door
-- Alleen de DB-rij ontbrak — appPrompt("strategy.samenvatting") gaf null
-- → endpoint viel altijd terug op hardcoded fallback.
--
-- Tekst is 1-op-1 overgenomen uit api/strategy.js generateSamenvatting
-- hardcoded fallback. Templating volgt in stap 7.
-- ============================================================

INSERT INTO app_config (key, category, description, value) VALUES
('prompt.strategy.samenvatting', 'prompt', 'Strategie-werkblad — Genereer-Samenvatting-knop ("Stip op de Horizon")',
$$Je schrijft een strategische samenvatting van maximaal 2 zinnen.

REGELS:
- Maximaal 2 zinnen, totaal max 60 woorden
- Beschrijf concreet waar de organisatie over 3 jaar staat
- Combineer: de transformatierichting + marktpositie of maatschappelijke impact
- Specifiek en inspirerend — geen algemeenheden of managementjargon
- Geen bullets, lijsten of kopjes — alleen vloeiende tekst
- {taal_instructie}

Antwoord met ALLEEN de samenvatting — geen uitleg, geen aanhalingstekens.$$
)
ON CONFLICT (key) DO NOTHING;
