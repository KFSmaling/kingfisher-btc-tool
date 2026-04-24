-- ============================================================
-- Multi-tenant migratie 6/7 — import_jobs RLS bijwerken
--
-- Doel:
--   Zelfde als canvas_uploads (005): directe user_id-check
--   vervangen door canvas-join zodat tenant-isolatie geërfd wordt.
--
-- Wat het doet:
--   - Verwijdert de oude "Eigen import jobs" policy
--   - Maakt nieuwe policy via canvas → tenant + user/rol
--
-- Notitie: user_id blijft als attribuut op import_jobs staan
--   (wie heeft de import gestart). Het stuurt alleen niet meer
--   de RLS — dat doet de canvas-join.
--
-- Afhankelijkheden: canvases nieuwe RLS (004), helper-functies (003)
--
-- Rollback:
--   DROP POLICY IF EXISTS "Eigen import jobs via canvas" ON import_jobs;
--   CREATE POLICY "Eigen import jobs"
--     ON import_jobs FOR ALL
--     USING     (user_id = auth.uid())
--     WITH CHECK (user_id = auth.uid());
-- ============================================================

DROP POLICY IF EXISTS "Eigen import jobs"            ON import_jobs;
DROP POLICY IF EXISTS "Eigen import jobs via canvas" ON import_jobs;

CREATE POLICY "Eigen import jobs via canvas"
  ON import_jobs FOR ALL
  USING (
    canvas_id IN (
      SELECT id FROM canvases
      WHERE  tenant_id = current_tenant_id()
      AND    (user_id = auth.uid() OR current_user_role() = 'tenant_admin')
    )
  )
  WITH CHECK (
    canvas_id IN (
      SELECT id FROM canvases
      WHERE  tenant_id = current_tenant_id()
      AND    (user_id = auth.uid() OR current_user_role() = 'tenant_admin')
    )
  );
