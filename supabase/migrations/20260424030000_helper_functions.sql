-- ============================================================
-- Multi-tenant migratie 3/7 — Helper-functies + tenants RLS
--
-- Doel:
--   Twee herbruikbare functies aanmaken die alle RLS-policies
--   in het platform gebruiken voor tenant-isolatie en rol-checks.
--   Tevens: RLS-policies op `tenants` toevoegen (kan pas nu
--   user_profiles bestaat).
--
-- Wat het doet:
--   - current_tenant_id(): leest tenant_id van ingelogde user
--   - current_user_role():  leest rol van ingelogde user
--   - Voegt SELECT-policy toe aan tenants tabel
--
-- Waarom SECURITY DEFINER:
--   Zonder SECURITY DEFINER wordt de functie uitgevoerd met de
--   rechten van de aanroepende user. Als user_profiles RLS heeft
--   (dat heeft het) en een policy op user_profiles current_tenant_id()
--   zou aanroepen, ontstaat recursie. SECURITY DEFINER laat de
--   functie draaien als de eigenaar (postgres/supabase_admin) en
--   omzeilt daarmee de RLS van user_profiles.
--
--   SET search_path = public: beveiligingsmaatregel tegen
--   search_path-injectie (Supabase aanbeveling voor SECURITY DEFINER).
--
-- Afhankelijkheden: user_profiles (002), tenants (001)
--
-- Rollback:
--   DROP FUNCTION IF EXISTS current_tenant_id();
--   DROP FUNCTION IF EXISTS current_user_role();
--   DROP POLICY IF EXISTS "Tenant leesbaar voor eigen leden" ON tenants;
-- ============================================================

-- ── current_tenant_id() ──────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM   user_profiles
  WHERE  id = auth.uid()
$$;

COMMENT ON FUNCTION current_tenant_id() IS
  'Retourneert de tenant_id van de ingelogde user. '
  'Gebruikt in alle RLS-policies voor tenant-isolatie. '
  'SECURITY DEFINER om recursie te vermijden (leest user_profiles).';

-- ── current_user_role() ──────────────────────────────────────

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM   user_profiles
  WHERE  id = auth.uid()
$$;

COMMENT ON FUNCTION current_user_role() IS
  'Retourneert de rol van de ingelogde user (platform_admin, tenant_admin, '
  'tenant_user, end_client_user). NULL als user geen profiel heeft. '
  'SECURITY DEFINER om recursie te vermijden (leest user_profiles).';

-- ── RLS policy op tenants ─────────────────────────────────────
-- Pas hier toevoegen: user_profiles en helper-functies bestaan nu.
--
-- Een user mag zijn eigen tenant lezen.
-- Schrijven (INSERT/UPDATE/DELETE) loopt via service role.

DROP POLICY IF EXISTS "Tenant leesbaar voor eigen leden" ON tenants;

CREATE POLICY "Tenant leesbaar voor eigen leden"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = current_tenant_id());
