-- ============================================================
-- Stap 7 — Fase 1d: block_definitions tenant-overrides mogelijk maken
--
-- Pre-flight: block_definitions had al synthetic id-PK + UNIQUE (key).
-- Vervang UNIQUE (key) door UNIQUE NULLS NOT DISTINCT (tenant_id, key)
-- om tenants eigen blok-titels (NL/EN) te laten configureren.
--
-- Path A (consistent met fase 1b app_config — V2 akkoord per 1124).
-- ============================================================

-- 1. tenant_id kolom (NULL = global)
ALTER TABLE block_definitions
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULL;

-- 2. Vervang UNIQUE (key) door UNIQUE NULLS NOT DISTINCT (tenant_id, key)
ALTER TABLE block_definitions DROP CONSTRAINT IF EXISTS block_definitions_key_key;
ALTER TABLE block_definitions
  ADD CONSTRAINT block_definitions_tenant_key_unique
  UNIQUE NULLS NOT DISTINCT (tenant_id, key);

-- 3. Index voor lookup (tenant-specifieke rijen)
CREATE INDEX IF NOT EXISTS idx_block_definitions_tenant_key
  ON block_definitions(tenant_id, key) WHERE tenant_id IS NOT NULL;

COMMENT ON COLUMN block_definitions.tenant_id IS
  'NULL = global (default). NOT NULL = tenant-specifieke override van blok-titel/-sublabel. Lookup-flow: probeert eerst tenant-specifiek, fallback naar global.';
