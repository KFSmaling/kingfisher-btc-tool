-- ============================================================
-- Stap 7 — Fase 1b: app_config tenant-overrides mogelijk maken
--
-- Drie veranderingen aan app_config:
--   1. Synthetic id-PK (was: PK op key)
--   2. tenant_id-kolom (NULL = global, NOT NULL = tenant-specifiek)
--   3. UNIQUE NULLS NOT DISTINCT (tenant_id, key) — één globale
--      rij per key, plus optioneel één per tenant
--
-- Path A uit pre-flight (PG 15+ NULLS NOT DISTINCT). Schoonst voor
-- PG 17.6, NULL-semantiek voor "global" is intuïtief.
--
-- Lookup-flow (fase 6):
--   SELECT DISTINCT ON (key) key, value
--   FROM app_config
--   WHERE tenant_id IS NULL OR tenant_id = current_tenant_id()
--   ORDER BY key, tenant_id NULLS LAST;
-- ============================================================

-- 1. Vervang PK(key) door PK(id) + UNIQUE(tenant_id, key)
ALTER TABLE app_config DROP CONSTRAINT IF EXISTS app_config_pkey;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE app_config ADD PRIMARY KEY (id);

-- 2. tenant_id kolom (NULL = global)
ALTER TABLE app_config
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULL;

-- 3. UNIQUE op (tenant_id, key) met NULLS NOT DISTINCT
--    → Eén rij per (tenant_id, key)-paar, ook als tenant_id NULL is
ALTER TABLE app_config
  ADD CONSTRAINT app_config_tenant_key_unique
  UNIQUE NULLS NOT DISTINCT (tenant_id, key);

-- 4. Index voor lookup-queries (alleen tenant-specifieke rijen,
--    de globale rijen worden alleen gebruikt als tenant geen override heeft)
CREATE INDEX IF NOT EXISTS idx_app_config_tenant_key
  ON app_config(tenant_id, key) WHERE tenant_id IS NOT NULL;

COMMENT ON COLUMN app_config.tenant_id IS
  'NULL = global (default). NOT NULL = tenant-specifieke override. Lookup-flow in code: probeert eerst tenant-specifiek, fallback naar global. UNIQUE NULLS NOT DISTINCT garandeert max 1 globale rij + max 1 tenant-rij per key.';
