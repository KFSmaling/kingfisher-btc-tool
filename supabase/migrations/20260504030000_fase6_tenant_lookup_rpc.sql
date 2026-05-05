-- ============================================================
-- Stap 7 — Fase 6: tenant-scoped lookup-flow voor app_config + block_definitions
--
-- Twee RPC-functies die DISTINCT ON gebruiken om per key de juiste rij
-- te kiezen: tenant-specifieke override boven globale baseline.
--
-- Pattern (instruction 2145 sectie 33-44):
--   SELECT DISTINCT ON (key) key, value, tenant_id
--   FROM <tabel>
--   WHERE tenant_id IS NULL OR tenant_id = current_tenant_id()
--   ORDER BY key, tenant_id NULLS LAST;
--
-- NULLS LAST + DISTINCT ON: tenant-rij wint over global-rij voor dezelfde key.
--
-- SECURITY INVOKER (default): RLS-policies van onderliggende tabellen blijven
-- van toepassing. Pre-login (anon role) krijgt 0 rijen — frontend valt terug
-- op LABEL_FALLBACKS. Post-login (authenticated role) krijgt de juiste set.
-- ============================================================

CREATE OR REPLACE FUNCTION get_app_config_for_tenant()
RETURNS TABLE (
  key text,
  value text,
  category text,
  description text,
  tenant_id uuid
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (ac.key)
    ac.key, ac.value, ac.category, ac.description, ac.tenant_id
  FROM app_config ac
  WHERE ac.tenant_id IS NULL OR ac.tenant_id = current_tenant_id()
  ORDER BY ac.key, ac.tenant_id NULLS LAST;
$$;

COMMENT ON FUNCTION get_app_config_for_tenant() IS
  'Stap-7 fase-6: leest app_config met tenant-overrides. Retourneert per key precies één rij — tenant-specifiek wint over global. Gebruikt door AppConfigContext frontend.';


CREATE OR REPLACE FUNCTION get_block_definitions_for_tenant()
RETURNS TABLE (
  key text,
  label_nl text,
  label_en text,
  ai_prompt text,
  sort_order int,
  tenant_id uuid
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (bd.key)
    bd.key, bd.label_nl, bd.label_en, bd.ai_prompt, bd.sort_order, bd.tenant_id
  FROM block_definitions bd
  WHERE bd.is_active = true
    AND (bd.tenant_id IS NULL OR bd.tenant_id = current_tenant_id())
  ORDER BY bd.key, bd.tenant_id NULLS LAST;
$$;

COMMENT ON FUNCTION get_block_definitions_for_tenant() IS
  'Stap-7 fase-6: leest active block_definitions met tenant-overrides. Retourneert per key precies één rij — tenant-specifiek wint over global. Gebruikt door fetchBlockDefinitions frontend.';
