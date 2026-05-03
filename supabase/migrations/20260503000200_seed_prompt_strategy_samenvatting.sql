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
