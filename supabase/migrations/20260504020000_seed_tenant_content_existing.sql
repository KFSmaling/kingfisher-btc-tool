-- ============================================================
-- Stap 7 — fase 4 voorbereiding: tenant_content seeds
--
-- Vooraf-seed van tenant_content voor de twee bestaande tenants.
-- Vervroegd uit oorspronkelijke fase 7a omdat fase 4 prompt-rewrite
-- aan {{tokens}} anders KF-productie-output zou breken (renderPrompt
-- zou lege strings produceren).
--
-- Token-vocabulair (bevestigd 2026-05-04T11:46:00):
--   {{brand_name}}              — naked, bedrijfsnaam
--   {{framework_name}}          — naked, methode/raamwerk-naam
--   {{brand_clause}}            — clause met leading-space, " bij Kingfisher & Partners" / ""
--   {{framework_clause}}        — clause, " Je bent gespecialiseerd in het BTC." / ""
--   {{industry_clause}}         — clause, " voor de financiële en verzekeringssector" / ""
--   {{example_segments_clause}} — clause, branche-specifieke segment-voorbeelden / ""
--
-- Idempotent via UPDATE (ON CONFLICT n.v.t. — tenants bestaan al).
-- ============================================================

-- Kingfisher-tenant: huidige KF-strings 1-op-1 in tokens
UPDATE tenants
SET tenant_content = jsonb_build_object(
  'brand_name',       'Kingfisher & Partners',
  'framework_name',   'het Business Transformatie Canvas (BTC)',
  'brand_clause',     ' bij Kingfisher & Partners',
  'framework_clause', ' Je bent gespecialiseerd in het Business Transformatie Canvas.',
  'industry_clause',  ' voor de financiële en verzekeringssector',
  'example_segments_clause', ''
)
WHERE slug = 'kingfisher';

-- Platform-tenant: lege clauses, generieke names
UPDATE tenants
SET tenant_content = jsonb_build_object(
  'brand_name',       'Platform',
  'framework_name',   'het strategische raamwerk',
  'brand_clause',     '',
  'framework_clause', '',
  'industry_clause',  '',
  'example_segments_clause', ''
)
WHERE slug = 'platform';
