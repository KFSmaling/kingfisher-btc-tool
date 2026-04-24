-- ============================================================
-- Multi-tenant migratie 5/7 — canvas_uploads RLS bijwerken
--
-- Doel:
--   De bestaande "Eigen uploads" policy vervangt door een policy
--   die via de canvas-join tenant-isolatie erft. De directe
--   user_id-check wordt daarmee vervangen door dezelfde logica
--   als canvases zelf gebruikt.
--
-- Wat het doet:
--   - Verwijdert de oude policy (directe user_id = auth.uid())
--   - Maakt nieuwe policy die filtert via canvas → tenant + user/rol
--
-- Notitie orphan-uploads:
--   canvas_uploads rijen met canvas_id IS NULL worden na deze policy
--   onbereikbaar via RLS. Die rijen worden verwijderd in 007 (seed).
--   Voer 007 uit vóór of direct na dit bestand.
--
-- Afhankelijkheden: canvases nieuwe RLS (004), helper-functies (003)
--
-- Rollback:
--   DROP POLICY IF EXISTS "Eigen uploads via canvas" ON canvas_uploads;
--   CREATE POLICY "Eigen uploads"
--     ON canvas_uploads FOR ALL
--     USING     (user_id = auth.uid())
--     WITH CHECK (user_id = auth.uid());
-- ============================================================

DROP POLICY IF EXISTS "Eigen uploads"            ON canvas_uploads;
DROP POLICY IF EXISTS "Eigen uploads via canvas" ON canvas_uploads;

CREATE POLICY "Eigen uploads via canvas"
  ON canvas_uploads FOR ALL
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
