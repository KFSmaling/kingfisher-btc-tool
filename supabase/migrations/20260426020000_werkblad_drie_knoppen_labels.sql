-- ============================================================
-- Sprint C: Werkblad-shell drie-knoppen-patroon (Issue #69)
--
-- Voegt 8 label-keys toe voor de canonical drie-knoppen-rij
-- (Analyse · Bekijken · Rapportage) en de "Terug naar werkblad"
-- knop in de Inzichten-overlay.
-- Idempotent via ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO app_config (key, value, category, description)
VALUES
  -- Drie-knoppen-shell op werkbladen
  ('label.werkblad.action.analyseer',                'Analyse draaien',           'label', 'Werkblad-knop — primaire actie analyse, idle-state (eerste keer)'),
  ('label.werkblad.action.analyseer_opnieuw',        'Opnieuw analyseren',        'label', 'Werkblad-knop — primaire actie analyse, na succesvolle eerste run'),
  ('label.werkblad.action.analyseert',               'Analyseren…',               'label', 'Werkblad-knop — primaire actie analyse, loading-state'),
  ('label.werkblad.action.bekijk_inzichten',         'Inzichten bekijken',        'label', 'Werkblad-knop — opent Inzichten-overlay'),
  ('label.werkblad.action.bekijk_disabled_tooltip',  'Eerst een analyse draaien', 'label', 'Werkblad-knop — tooltip wanneer Inzichten-knop disabled is (geen analyse)'),
  ('label.werkblad.action.rapportage',               'Rapportage',                'label', 'Werkblad-knop — opent rapportage (uitgebreide print-versie)'),
  ('label.werkblad.action.rapportage_tooltip',       'Volgt in volgende release', 'label', 'Werkblad-knop — tooltip op rapportage als nog niet beschikbaar (forward-compat)'),
  -- Inzichten-overlay terug-knop
  ('label.analysis.action.terug',                    '← Terug naar werkblad',     'label', 'Inzichten-overlay — terug-knop rechtsboven (vervangt sluit-X)')
ON CONFLICT (key) DO NOTHING;

-- Verificatie
SELECT key, value FROM app_config WHERE key LIKE 'label.werkblad.action.%' OR key = 'label.analysis.action.terug' ORDER BY key;
