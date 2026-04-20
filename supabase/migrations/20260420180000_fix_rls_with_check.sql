-- ============================================================
-- Fix RLS WITH CHECK voor Sprint 4B tabellen
-- PostgreSQL gebruikt USING als WITH CHECK bij FOR ALL, maar
-- Supabase/PostgREST valideert INSERT-paden strikt apart.
-- Expliciete WITH CHECK voorkomt RLS-fouten bij upsert.
-- ============================================================

-- strategy_core
DROP POLICY IF EXISTS "Own canvas" ON strategy_core;
CREATE POLICY "Own canvas" ON strategy_core
  FOR ALL
  USING      (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))
  WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));

-- analysis_items
DROP POLICY IF EXISTS "Own canvas" ON analysis_items;
CREATE POLICY "Own canvas" ON analysis_items
  FOR ALL
  USING      (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))
  WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));

-- strategic_themes
DROP POLICY IF EXISTS "Own canvas" ON strategic_themes;
CREATE POLICY "Own canvas" ON strategic_themes
  FOR ALL
  USING      (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()))
  WITH CHECK (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));

-- ksf_kpi
DROP POLICY IF EXISTS "Own theme" ON ksf_kpi;
CREATE POLICY "Own theme" ON ksf_kpi
  FOR ALL
  USING (
    theme_id IN (
      SELECT st.id FROM strategic_themes st
      JOIN canvases c ON st.canvas_id = c.id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    theme_id IN (
      SELECT st.id FROM strategic_themes st
      JOIN canvases c ON st.canvas_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
