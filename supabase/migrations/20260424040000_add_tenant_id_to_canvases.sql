-- ============================================================
-- Multi-tenant migratie 4/7 — tenant_id aan canvases + nieuwe RLS
--
-- Doel:
--   Canvases koppelen aan een tenant. Dit is het enige datapunt
--   dat alle downstream-tabellen (strategy_core, analysis_items,
--   strategic_themes, guidelines, etc.) nodig hebben om
--   tenant-isolatie te erven — zij filteren al via canvas_id.
--
-- Wat het doet:
--   - Voegt tenant_id kolom toe als nullable uuid met FK naar tenants
--     (NOT NULL wordt pas in 007 gezet, ná de data-update)
--   - Voegt index toe voor RLS-performance
--   - Vervangt de bestaande "Eigen canvassen" policy door een nieuwe
--     die zowel tenant- als user-isolatie afdwingt
--
-- Nieuwe RLS-logica:
--   USING:      tenant_id = current_tenant_id()
--               AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin')
--   → User ziet eigen canvassen. tenant_admin ziet alles binnen tenant.
--
--   WITH CHECK: zelfde als USING
--   → tenant_admin kan canvassen van anderen aanpassen binnen tenant.
--     Voor INSERT geldt altijd user_id = auth.uid() (de app stelt
--     user_id altijd in op de ingelogde user bij aanmaken).
--
-- Kanttekening downstream-tables:
--   strategy_core, analysis_items, strategic_themes, guidelines en
--   guideline_analysis filteren via:
--     canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
--   Dit werkt correct voor tenant_user. Voor tenant_admin die data van
--   collega's wil zien zijn deze downstream-policies te restrictief.
--   Oplossing volgt in de canvas-sharing sprint (buiten scope nu).
--
-- Afhankelijkheden: tenants (001), helper-functies (003)
--
-- Rollback-notitie:
--   Na uitvoering van 007 (NOT NULL) is rollback bewerkelijker:
--   1. ALTER TABLE canvases ALTER COLUMN tenant_id DROP NOT NULL;
--   2. DROP POLICY "Eigen canvassen" ON canvases;
--   3. Herstel oude policy: FOR ALL USING (user_id = auth.uid())
--      WITH CHECK (user_id = auth.uid())
--   4. ALTER TABLE canvases DROP COLUMN tenant_id;
-- ============================================================

-- ── Stap 1: kolom toevoegen als nullable ─────────────────────
-- NOT NULL wordt pas in 007 gezet, nadat alle bestaande rijen
-- een tenant_id hebben gekregen via de seed-UPDATE.

ALTER TABLE canvases
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT;

-- Index voor performante RLS-policy evaluatie.
-- Elke query door een ingelogde user triggert current_tenant_id()-check.
CREATE INDEX IF NOT EXISTS canvases_tenant_id_idx
  ON canvases (tenant_id);

-- ── Stap 2: RLS-policy vervangen ─────────────────────────────

-- Verwijder oude policy (naam uit sprint_1 migratie)
DROP POLICY IF EXISTS "Eigen canvassen" ON canvases;

CREATE POLICY "Eigen canvassen"
  ON canvases FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND (
      user_id = auth.uid()
      OR current_user_role() = 'tenant_admin'
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (
      user_id = auth.uid()
      OR current_user_role() = 'tenant_admin'
    )
  );
