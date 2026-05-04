-- ============================================================
-- Stap 7 — Fase 1c: app_config.tenant_overridable boolean
--
-- ADR-002 niveau-3 voorbereiding. Niveau 3 (tenant kan eigen
-- prompt-tekst maken) is in stap 7 NIET geïmplementeerd —
-- alleen het schema-veld is voorbereid.
--
-- Niveau 1 (deze sprint): tenants kunnen alleen tenant_content-
-- variabelen beïnvloeden. Prompt-tekst zelf is platform-eigendom.
-- ============================================================

ALTER TABLE app_config
  ADD COLUMN IF NOT EXISTS tenant_overridable boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN app_config.tenant_overridable IS
  'ADR-002 niveau-3 voorbereiding. true = tenant kan eigen prompt-tekst maken (via niveau-3-flow, nog niet geïmplementeerd). Default false (alleen platform-admin kan de prompt-tekst aanpassen, tenants kunnen alleen tenant_content-vars beïnvloeden).';
