-- ── Fix: zorg dat samenvatting kolom ZEKER bestaat in strategy_core ──────────
-- Idempotent — veilig opnieuw uitvoeren.
-- Vorige migration (20260421110000) bevatte deze ook maar kan gemist zijn.

ALTER TABLE strategy_core
  ADD COLUMN IF NOT EXISTS samenvatting text DEFAULT '';
