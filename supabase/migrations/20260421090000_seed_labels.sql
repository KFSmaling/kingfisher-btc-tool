-- ── Labels uitbreiden — Sprint 8 Admin Upgrade ────────────────────────────────
-- Voegt alle UI-labels toe die dynamisch per klant aanpasbaar moeten zijn.
-- Bestaande keys worden overgeslagen (ON CONFLICT DO NOTHING).

INSERT INTO app_config (key, category, description, value) VALUES

  -- Applicatie (header + footer)
  ('label.footer.tagline',  'label', 'Voettekst onderaan het canvas',  'Kingfisher & Partners · From strategy to execution'),

  -- Strategie Werkblad — sectiekoppen
  ('label.strat.section.identiteit', 'label', 'Sectienaam Identiteit (h3)',        'Identiteit'),
  ('label.strat.section.analyse',    'label', 'Sectienaam Analyse (h3)',            'Analyse'),
  ('label.strat.section.executie',   'label', 'Sectienaam Executie (h3)',           'Executie — 7·3·3 Regel'),

  -- Strategie Werkblad — veldnamen
  ('label.strat.field.missie',       'label', 'Veldnaam Missie',                   'Missie'),
  ('label.strat.field.visie',        'label', 'Veldnaam Visie',                    'Visie'),
  ('label.strat.field.ambitie',      'label', 'Veldnaam Ambitie',                  'Ambitie (BHAG)'),
  ('label.strat.field.kernwaarden',  'label', 'Veldnaam Kernwaarden',              'Kernwaarden'),
  ('label.strat.field.extern',       'label', 'Kolomnaam Externe analyse',         'Externe Ontwikkelingen'),
  ('label.strat.field.intern',       'label', 'Kolomnaam Interne analyse',         'Interne Ontwikkelingen'),

  -- Werkblad naam Richtlijnen
  ('label.werkblad.richtlijnen',     'label', 'Naam Richtlijnen Werkblad',         'Richtlijnen & Leidende Principes'),

  -- Richtlijnen Werkblad — segment namen + subtitels
  ('label.richtl.segment.generiek',       'label', 'Segment naam Generiek',              'Generiek'),
  ('label.richtl.segment.generiek.sub',   'label', 'Segment subtitel Generiek',          'Strategie & Governance'),
  ('label.richtl.segment.klanten',        'label', 'Segment naam Klanten',               'Klanten'),
  ('label.richtl.segment.klanten.sub',    'label', 'Segment subtitel Klanten',           'Markt & Dienstverlening'),
  ('label.richtl.segment.organisatie',    'label', 'Segment naam Organisatie',           'Organisatie'),
  ('label.richtl.segment.organisatie.sub','label', 'Segment subtitel Organisatie',       'Mens & Proces'),
  ('label.richtl.segment.it',             'label', 'Segment naam IT',                    'IT'),
  ('label.richtl.segment.it.sub',         'label', 'Segment subtitel IT',                'Technologie & Data')

ON CONFLICT (key) DO NOTHING;
