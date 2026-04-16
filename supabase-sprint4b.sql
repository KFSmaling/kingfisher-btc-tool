-- Sprint 4B: Strategie Werkblad — nieuwe tabellen
-- Voer dit uit in de Supabase SQL editor

-- strategy_core: 1:1 per canvas
CREATE TABLE IF NOT EXISTS strategy_core (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id   uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  missie      text DEFAULT '',
  visie       text DEFAULT '',
  ambitie     text DEFAULT '',
  kernwaarden jsonb DEFAULT '[]'::jsonb,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (canvas_id)
);

-- analysis_items: externe/interne ontwikkelingen met SWOT-tag
CREATE TABLE IF NOT EXISTS analysis_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id  uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('extern', 'intern')),
  content    text NOT NULL DEFAULT '',
  tag        text NOT NULL DEFAULT 'niet_relevant'
             CHECK (tag IN ('kans','sterkte','bedreiging','zwakte','niet_relevant')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- strategic_themes: max 7 per canvas
CREATE TABLE IF NOT EXISTS strategic_themes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id  uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ksf_kpi: max 3 KSF + 3 KPI per thema
CREATE TABLE IF NOT EXISTS ksf_kpi (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id      uuid NOT NULL REFERENCES strategic_themes(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('ksf','kpi')),
  description   text NOT NULL DEFAULT '',
  current_value text DEFAULT '',
  target_value  text DEFAULT '',
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE strategy_core    ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ksf_kpi          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own canvas" ON strategy_core    FOR ALL USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));
CREATE POLICY "Own canvas" ON analysis_items   FOR ALL USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));
CREATE POLICY "Own canvas" ON strategic_themes FOR ALL USING (canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid()));
CREATE POLICY "Own theme"  ON ksf_kpi          FOR ALL USING (theme_id IN (SELECT st.id FROM strategic_themes st JOIN canvases c ON st.canvas_id = c.id WHERE c.user_id = auth.uid()));
