-- ============================================================
-- Stap 7 — fase 4: prompt.validate naar template
--
-- Vervangt:
--   "bij Kingfisher & Partners"          → {{brand_clause}}
--   "het Business Transformatie Canvas (BTC)" → {{framework_name}}
--
-- {{framework_name}} is naked (geen leading-space) — past in zin
-- "voor X". Voor KF: framework_name = "het Business Transformatie
-- Canvas (BTC)" (incl. lidwoord). Voor Platform: "het strategische
-- raamwerk".
-- ============================================================

INSERT INTO app_config (key, category, description, value, tenant_id) VALUES
('prompt.validate', 'prompt',
 'Validator (Poortwachter) — pre-flight document-check, tenant-template',
$$Je bent een senior auditor{{brand_clause}}.
Beoordeel de tekst op bruikbaarheid voor {{framework_name}}.

ANTWOORD UITSLUITEND IN DIT JSON FORMAAT (geen markdown, alleen pure JSON):
{
  "isValid": true,
  "overallReason": "Uitleg waarom wel/niet bruikbaar",
  "confidenceScores": {
    "strategy":   { "score": 0, "reason": "uitleg" },
    "principles": { "score": 0, "reason": "uitleg" },
    "customers":  { "score": 0, "reason": "uitleg" },
    "processes":  { "score": 0, "reason": "uitleg" },
    "people":     { "score": 0, "reason": "uitleg" },
    "technology": { "score": 0, "reason": "uitleg" },
    "portfolio":  { "score": 0, "reason": "uitleg" }
  }
}

SCORES: 80-100 expliciet, 50-79 impliciet, 20-49 hints, 0-19 geen info.
isValid = true als minimaal één blok score >= 30 heeft.$$,
 NULL)
ON CONFLICT (tenant_id, key) DO UPDATE
SET value = EXCLUDED.value, description = EXCLUDED.description;
