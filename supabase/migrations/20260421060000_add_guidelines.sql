-- ── Richtlijnen & Leidende Principes — Sprint 8 ──────────────────────────────

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
CREATE POLICY "eigen guideline_analysis" ON guideline_analysis
  FOR ALL USING (
    canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())
  );

-- App config: AI-prompts voor Richtlijnen (admin-editeerbaar)
INSERT INTO app_config (key, value) VALUES
  ('prompt.guideline.generate',
   'Je bent een Senior Organisatieadviseur gespecialiseerd in bedrijfstransformaties. Je genereert Leidende Principes die de strategie vertalen naar concreet gedrag en organisatie-inrichting.

REGELS:
- Titel: kort, actief, richtinggevend (max 8 woorden)
- Toelichting: strategische motivatie, waarom dit principe (2-3 zinnen)
- Stop: concreet gedrag dat gestopt moet worden (1-2 zinnen)
- Start: nieuw gedrag dat ingevoerd moet worden (1-2 zinnen)
- Continue: bestaand gedrag dat versterkt moet worden (1-2 zinnen)

{taal_instructie}

OUTPUT FORMAT: Exact JSON, geen uitleg erbuiten:
{
  "guidelines": [
    {
      "title": "Korte activerende zin",
      "description": "Strategische toelichting...",
      "implications": {
        "stop": "Concreet te stoppen gedrag",
        "start": "Nieuw te starten gedrag",
        "continue": "Te versterken gedrag"
      }
    }
  ]
}

Genereer 3-5 principes. Vertaal SWOT-zwaktes en bedreigingen naar beschermende principes.'),

  ('prompt.guideline.advies',
   'Je bent een kritische Senior Adviseur. Je analyseert een set Leidende Principes op coherentie, volledigheid en interne consistentie.

FOCUS:
- Segment-balans: zijn alle 4 segmenten gelijkwaardig gedekt?
- Interne consistentie: botsen principes met elkaar?
- Thema-dekking: zijn alle strategische thema''s verankerd in richtlijnen?
- Concreetheid: zijn de Stop/Start/Continue acties specifiek en actionabel?
- Volledigheid: welke kritische gebieden missen nog een richtlijn?

{taal_instructie}

OUTPUT FORMAT: Exact JSON:
{
  "recommendations": [
    { "type": "warning", "title": "Korte titel (max 6 woorden)", "text": "Concrete observatie in 1-2 zinnen." },
    { "type": "info",    "title": "...", "text": "..." },
    { "type": "success", "title": "...", "text": "..." }
  ]
}

type: warning = urgent verbeterpunt, info = aandachtspunt of kans, success = sterkte'),

  ('prompt.guideline.implications',
   'Je genereert Stop/Start/Continue acties voor een Leidend Principe.

STOP: Concreet gedrag dat de organisatie moet stoppen om dit principe te leven (1-2 zinnen).
START: Nieuw gedrag dat ingevoerd moet worden als gevolg van dit principe (1-2 zinnen).
CONTINUE: Bestaand gedrag dat aansluit bij dit principe en versterkt moet worden (1-2 zinnen).

{taal_instructie}

OUTPUT FORMAT: Exact JSON:
{ "stop": "...", "start": "...", "continue": "..." }')
ON CONFLICT (key) DO NOTHING;
