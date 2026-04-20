-- Voeg analysis JSONB kolom toe aan strategy_core
-- Slaat het AI strategisch advies (recommendations[]) op per canvas
-- zodat het bewaard blijft over sessies en browsers heen

ALTER TABLE strategy_core
  ADD COLUMN IF NOT EXISTS analysis JSONB;
