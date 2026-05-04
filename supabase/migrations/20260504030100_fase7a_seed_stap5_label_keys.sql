-- ============================================================
-- Stap 7 — Fase 7a: seed 5 nieuwe label-keys uit stap-5 cleanup B
--
-- Tijdens stap 5 zijn vijf appLabel(key, fallback)-aanroepen
-- toegevoegd zonder DB-keys (werken via fallback-pad). Nu seeden
-- als globale (tenant_id IS NULL) defaults.
--
-- Fallback-tekst overgenomen uit:
--   src/LoginScreen.js:105, 134, 211
--   src/features/strategie/StrategyOnePager.jsx:83
--   src/features/richtlijnen/GuidelinesOnePager.jsx:195
--
-- Idempotent: ON CONFLICT (tenant_id, key) DO NOTHING.
-- (Anders dan prompt-rewrites: hier willen we GEEN UPDATE want
-- handmatige Admin-edits in de toekomst moeten respecteert worden.)
-- ============================================================

INSERT INTO app_config (key, category, description, value, tenant_id) VALUES
('login.internal_use',       'label', 'Login-scherm — sub-tekst onder "Inloggen"-titel',                  'intern gebruik',                            NULL),
('login.email_placeholder',  'label', 'Login-scherm — placeholder voor e-mailveld',                        'naam@example.com',                          NULL),
('login.confidential',       'label', 'Login-scherm — voettekst (na brandName)',                          'Vertrouwelijk',                             NULL),
('onepager.confidential',    'label', 'OnePager (Strategie + Richtlijnen) — voettekst (na brandName)',    'Vertrouwelijk',                             NULL),
('guidelines.title',         'label', 'Richtlijnen-OnePager — voettekst-titel (na brandName)',            'Richtlijnen & Leidende Principes',          NULL)
ON CONFLICT (tenant_id, key) DO NOTHING;
