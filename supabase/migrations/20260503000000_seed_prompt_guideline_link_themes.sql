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
