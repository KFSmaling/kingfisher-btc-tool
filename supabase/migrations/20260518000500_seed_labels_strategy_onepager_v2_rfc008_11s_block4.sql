-- RFC-008 §F + instructie 11.S Block 4 §9 — labels voor StrategyOnePager v2
-- (brand-strip / titel / identiteits-band / KPI-fallbacks / themas / SWOT /
-- AI / footer + body-empty + brand-fallback) + builder-tooltip-update.
-- 28 nieuwe keys totaal. tenant_overridable mix: BHAG/Horizon zijn
-- tenant_overridable=true (consultancy-tenant kan eigen naming kiezen);
-- rest false (generieke UI).

INSERT INTO app_config (key, category, description, value, tenant_id, tenant_overridable) VALUES
  ('label.strategie.onepager.brand.fallback',                'label', 'Brand-strip fallback wanneer tenantBrand null', 'Platform', NULL, false),
  ('label.strategie.onepager.brand.kicker',                  'label', 'Brand-strip kicker rechts van brand-naam', 'Business Transformation Canvas', NULL, false),
  ('label.strategie.onepager.werkblad.label',                'label', 'Brand-strip eyebrow rechts', 'WERKBLAD', NULL, false),
  ('label.strategie.onepager.werkblad.naam',                 'label', 'Brand-strip werkbladnaam rechts', 'STRATEGIE', NULL, false),
  ('label.strategie.onepager.titel.eyebrow',                 'label', 'Titel-block eyebrow boven H1', 'STRATEGIE · EXECUTIVE SUMMARY', NULL, false),
  ('label.strategie.onepager.titel.fallback',                'label', 'Titel-block H1 fallback bij lege samenvatting', 'Strategische samenvatting nog niet gegenereerd', NULL, false),
  ('label.strategie.onepager.identiteit.missie.label',       'label', 'Identiteits-band Missie label', 'MISSIE', NULL, false),
  ('label.strategie.onepager.identiteit.missie.fallback',    'label', 'Identiteits-band Missie fallback', 'Missie nog niet ingevuld', NULL, false),
  ('label.strategie.onepager.identiteit.visie.label',        'label', 'Identiteits-band Visie label', 'VISIE', NULL, false),
  ('label.strategie.onepager.identiteit.visie.fallback',     'label', 'Identiteits-band Visie fallback', 'Visie nog niet ingevuld', NULL, false),
  ('label.strategie.onepager.identiteit.ambitie.label',      'label', 'Identiteits-band Ambitie label', 'AMBITIE', NULL, false),
  ('label.strategie.onepager.identiteit.ambitie.fallback',   'label', 'Identiteits-band Ambitie fallback', 'Ambitie nog niet ingevuld', NULL, false),
  ('label.strategie.onepager.identiteit.ambitie.eyebrow',    'label', 'Identiteits-band Ambitie eyebrow boven tekst', 'BHAG', NULL, true),
  ('label.strategie.onepager.identiteit.kernwaarden.label',  'label', 'Identiteits-band + Kernwaarden-bord-model label', 'KERNWAARDEN', NULL, false),
  ('label.strategie.onepager.kpi.bhag_fallback.label',       'label', 'KPI-strip BHAG-fallback-cel label', 'BHAG', NULL, true),
  ('label.strategie.onepager.kpi.horizon_fallback.label',    'label', 'KPI-strip Horizon-fallback-cel label', 'Horizon', NULL, true),
  ('label.strategie.onepager.kpi.horizon_fallback.target',   'label', 'KPI-strip Horizon-fallback-cel target_value', '5 jaar', NULL, true),
  ('label.strategie.onepager.themas.titel',                  'label', 'Themas-grid sectie-titel', '01 · STRATEGISCHE THEMA''S · KSF & KPI', NULL, false),
  ('label.strategie.onepager.themas.fallback',               'label', 'Themas-grid fallback bij 0 thema''s', 'Geen strategische thema''s gedefinieerd — voeg eerst toe', NULL, false),
  ('label.strategie.onepager.swot.titel',                    'label', 'SWOT-model sectie-titel', 'SWOT-analyse — intern en extern', NULL, false),
  ('label.strategie.onepager.swot.sterkten',                 'label', 'SWOT-quadrant Sterkten label', 'Sterkten', NULL, false),
  ('label.strategie.onepager.swot.zwakten',                  'label', 'SWOT-quadrant Zwakten label', 'Zwakten', NULL, false),
  ('label.strategie.onepager.swot.kansen',                   'label', 'SWOT-quadrant Kansen label', 'Kansen', NULL, false),
  ('label.strategie.onepager.swot.bedreigingen',             'label', 'SWOT-quadrant Bedreigingen label', 'Bedreigingen', NULL, false),
  ('label.strategie.onepager.ai.titel',                      'label', 'AI-aandachtspunten-blok titel', 'AI · Aandachtspunten', NULL, false),
  ('label.strategie.onepager.ai.fallback.empty',             'label', 'AI-blok fallback bij withAi=true + 0 in_rapport-insights', 'AI-inzichten uit voor dit rapport', NULL, false),
  ('label.strategie.onepager.footer.classification',         'label', 'Footer-classification-tekst links', 'Vertrouwelijk — alleen voor genoemde klant', NULL, false),
  ('label.strategie.onepager.body.empty',                    'label', 'Body-zone empty-state wanneer 0 modellen geselecteerd', 'Geen modellen geselecteerd — kies in linker paneel.', NULL, false)
ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- Block 3 tooltip-key updaten (Block 3 schreef "komt in Block 4"; Block 4 = live)
UPDATE app_config
SET value = 'Print of opslaan als PDF'
WHERE key = 'label.onepager.builder.action.print.tooltip' AND tenant_id IS NULL;
