-- ============================================================
-- Stap 7 — Fase 1a: tenants.tenant_content jsonb-kolom
--
-- Doel: placeholder-waarden voor prompt-templates en label-fallbacks.
-- Gebruikt door template-engine in api/_template.js (fase 2).
--
-- Voorbeeld: {"brand_name": "Kingfisher", "framework_name":
-- "Business Transformation Canvas", "industry_context":
-- "financiële sector", "example_segments": "..."}
-- ============================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tenant_content jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN tenants.tenant_content IS
  'Placeholder-waarden voor prompt-templates en label-fallbacks. Gebruikt door template-engine in api/_template.js. Voorbeeld: {"brand_name": "Kingfisher", "framework_name": "Business Transformation Canvas", "industry_context": "financiële sector", "example_segments": "..."}.';
