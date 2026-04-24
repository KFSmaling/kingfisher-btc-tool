-- ============================================================
-- Multi-tenant migratie 2/7 — User Profiles tabel
--
-- Doel:
--   Koppelt elke Supabase Auth-user aan een tenant en een rol.
--   Dit is de bron voor current_tenant_id() en current_user_role().
--
-- Wat het doet:
--   - Maakt `user_profiles` aan als 1:1-extensie op auth.users
--   - Legt tenant_id en rol vast per user
--   - RLS: user mag alleen eigen rij lezen/updaten
--     (GEEN current_tenant_id() hier — zou recursie veroorzaken
--      omdat current_tenant_id() zelf deze tabel leest)
--
-- Afhankelijkheden: tenants tabel (001)
--
-- Rollback (veilig zolang 003–007 nog niet zijn uitgevoerd):
--   DROP TABLE IF EXISTS user_profiles;
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Zelfde UUID als auth.users — geen aparte PK-reeks.
  -- ON DELETE CASCADE: als auth-user verwijderd wordt, verdwijnt profiel mee.
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ON DELETE RESTRICT: voorkomt dat een tenant verwijderd wordt
  -- zolang er nog users aan hangen.
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

  -- Vier rollen conform architecture-spec §4.2.
  -- Default 'tenant_user': veiligste uitgangspositie bij aanmaken.
  role        text        NOT NULL DEFAULT 'tenant_user'
                          CHECK (role IN (
                            'platform_admin',
                            'tenant_admin',
                            'tenant_user',
                            'end_client_user'
                          )),

  -- Gebruikers-specifieke instellingen (taal, UI-prefs, etc.).
  preferences jsonb       NOT NULL DEFAULT '{}',

  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ── RLS policies ─────────────────────────────────────────────
--
-- BELANGRIJK: gebruik hier GEEN current_tenant_id() of current_user_role().
-- Die functies lezen user_profiles op — aanroepen vanuit de RLS-policy
-- van user_profiles zelf veroorzaakt oneindige recursie.
-- Directe auth.uid()-check is hier correct en voldoende.

DROP POLICY IF EXISTS "Eigen profiel leesbaar"   ON user_profiles;
DROP POLICY IF EXISTS "Eigen profiel aanpasbaar" ON user_profiles;

-- User ziet alleen zijn eigen profielrij.
CREATE POLICY "Eigen profiel leesbaar"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- User mag eigen profiel updaten (bijv. preferences).
-- Rol en tenant_id aanpassen loopt via service role (admin-context),
-- niet via de app — geen apart WITH CHECK nodig voor die kolommen
-- omdat de app die velden niet aanbiedt voor update.
CREATE POLICY "Eigen profiel aanpasbaar"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING     (id = auth.uid())
  WITH CHECK (id = auth.uid());
