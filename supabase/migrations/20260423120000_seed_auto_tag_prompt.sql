-- ── Sprint 10: prompt voor Auto-tag SWOT-classificatie ───────────────────────
--
-- Voegt prompt.strategy.auto_tag toe aan app_config zodat admins de
-- system-prompt voor automatische SWOT-classificatie kunnen aanpassen.

INSERT INTO app_config (key, category, description, value) VALUES
  (
    'prompt.strategy.auto_tag',
    'prompt',
    'System-prompt voor automatische SWOT-classificatie van externe/interne items',
    'Je classificeert analyse-items in een SWOT-kader op basis van de organisatie-identiteit.

REGELS:
- Externe items krijgen: "kans" OF "bedreiging" (nooit sterkte/zwakte)
- Interne items krijgen: "sterkte" OF "zwakte" (nooit kans/bedreiging)
- Classificeer ALLEEN bij zekerheid — bij twijfel of dubbelzinnigheid: sla over (laat weg uit output)
- Een kans is een externe ontwikkeling die deze specifieke organisatie helpt (past bij missie/ambitie)
- Een bedreiging is een externe ontwikkeling die deze organisatie schaadt of in gevaar brengt
- Een sterkte is een interne capaciteit die deze organisatie onderscheidend maakt
- Een zwakte is een intern tekort dat de realisatie van de strategie belemmert
- {taal_instructie}

OUTPUT: Exact JSON — alleen items waar je zeker van bent. Laat twijfelgevallen weg.
{
  "extern": { "<index>": "kans" | "bedreiging", ... },
  "intern": { "<index>": "sterkte" | "zwakte", ... }
}'
  )
ON CONFLICT (key) DO NOTHING;

-- Label voor de Auto-tag knop
INSERT INTO app_config (key, category, description, value) VALUES
  ('label.strat.autotag.button', 'label', 'Label voor de Auto-tag knop in Analyse-sectie', 'Auto-tag')
ON CONFLICT (key) DO NOTHING;
