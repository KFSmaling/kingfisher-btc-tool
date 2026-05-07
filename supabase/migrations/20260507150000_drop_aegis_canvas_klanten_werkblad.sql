-- ============================================================
-- Stap 11.E correctie — drop Aegis-fictie test-canvas (en leeg test-canvas)
--
-- 11.D-keuze voor Pad A (seed-canvas) was overhead: Strategie/Richtlijnen-
-- werkbladen hebben ook nooit seed-data, gebruikers vullen zelf. RLS-tests
-- hebben hun eigen fixtures die zichzelf opruimen (`tests/rls/cd_klanten_*`).
--
-- ON DELETE CASCADE op canvas_id zorgt automatisch voor cleanup van
-- bijhorende cd_dimensions + cd_items. Expliciete verwijdering van beide
-- canvas-IDs (Aegis + leeg-test-canvas) voor leesbaarheid.
--
-- Geen wijziging aan cd_*-tabellen, RLS-policies of triggers.
-- ============================================================

DELETE FROM canvases WHERE id IN (
  'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa',  -- Aegis Verzekering — Klanten & Dienstverlening
  'bbbbbbbb-eeee-eeee-eeee-bbbbbbbbbbbb'   -- Klanten — leeg test-canvas
);

-- Verifiëer (commentaar):
-- SELECT count(*) FROM cd_dimensions WHERE canvas_id = 'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa'; -- moet 0 zijn (CASCADE)
-- SELECT count(*) FROM cd_items      WHERE canvas_id = 'aaaaaaaa-eeee-eeee-eeee-aaaaaaaaaaaa'; -- moet 0 zijn (CASCADE)
