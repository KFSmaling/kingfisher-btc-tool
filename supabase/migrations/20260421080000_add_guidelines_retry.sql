-- ── Richtlijnen & Leidende Principes — Sprint 8 (retry: fix missing category column) ──

-- Guidelines tabel: één rij per principe per canvas
CREATE TABLE IF NOT EXISTS guidelines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id     uuid NOT NULL REFERENCES canvases(id),
  segment       text NOT NULL CHECK (segment IN ('generiek','klanten','organisatie','it')),
  title         text NOT NULL DEFAULT '',
  description   text DEFAULT '',
  implications  jsonb DEFAULT '{"stop":"","start":"","continue":""}',
  linked_themes jsonb DEFAULT '[]',
  sort_order    int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eigen guidelines" ON guidelines;
CREATE POLICY "eigen guidelines" ON guidelines
  FOR ALL USING (
    canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
  );

-- Guideline analysis: AI-inzichten apart (houdt strategy_core licht)
CREATE TABLE IF NOT EXISTS guideline_analysis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id       uuid NOT NULL REFERENCES canvases(id) UNIQUE,
  recommendations jsonb DEFAULT '[]',
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE guideline_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eigen guideline_analysis" ON guideline_analysis;
CREATE POLICY "eigen guideline_analysis" ON guideline_analysis
  FOR ALL USING (
    canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
  );

-- App config: AI-prompts voor Richtlijnen (category kolom toegevoegd)
INSERT INTO app_config (key, category, value) VALUES
  ('prompt.guideline.generate', 'prompt',
   'Je bent een Senior Organisatieadviseur gespecialiseerd in bedrijfstransformaties. Je genereert Leidende Principes die de strategie vertalen naar concreet gedrag.

REGELS:
- Titel: kort, actief, richtinggevend (max 8 woorden)
- Toelichting: strategische motivatie, waarom dit principe (2-3 zinnen)
- Stop/Start/Continue: concreet gedrag (1-2 zinnen elk)

{taal_instructie}

OUTPUT FORMAT: Exact JSON, geen uitleg erbuiten:
{"guidelines":[{"title":"...","description":"...","implications":{"stop":"...","start":"...","continue":"..."}}]}

Genereer 3-5 principes.'),

  ('prompt.guideline.advies', 'prompt',
   'Je bent een kritische Senior Adviseur. Je analyseert Leidende Principes op coherentie, volledigheid en interne consistentie.

{taal_instructie}

OUTPUT FORMAT: Exact JSON:
{"recommendations":[{"type":"warning","title":"...","text":"..."},{"type":"info","title":"...","text":"..."},{"type":"success","title":"...","text":"..."}]}

type: warning=urgent verbeterpunt, info=aandachtspunt, success=sterkte. Geef 4-6 aanbevelingen.'),

  ('prompt.guideline.implications', 'prompt',
   'Je genereert Stop/Start/Continue acties voor een Leidend Principe.

{taal_instructie}

OUTPUT FORMAT: Exact JSON:
{"stop":"...","start":"...","continue":"..."}')
ON CONFLICT (key) DO NOTHING;
