-- ============================================================
-- Theming seed v2 — volledige theme_config incl. secundaire kleuren
--
-- Uitvoeren: handmatig in Supabase SQL Editor
-- Vervangt theming-seed.sql volledig (idempotent UPDATE)
-- ============================================================

-- ── Platform (Tenant 1) ──────────────────────────────────────
--
-- Primair:  #0f172a (slate-900 — diep donker)
-- Accent:   #f97316 (orange-500)
--
-- Secundaire keuzes en rationale:
--
-- accent_hover_color  #ea6c0a  Donkere oranje — hover-state van #f97316.
--                              Volgt dezelfde logica als Kingfisher's
--                              #7ab52e als hover van #8dc63f: 15-20%
--                              donkerder, zelfde hue.
--
-- success_color       #2c7a4b  Zelfde als Kingfisher. Groen voor
--                              "voltooid / klaar" is universele UX-
--                              conventie, niet merk-gebonden. Veranderen
--                              zou verwarrend zijn voor gebruikers.
--
-- analysis_color      #0ea5e9  Sky-500 i.p.v. #00AEEF. Functioneel
--                              identiek (blauw = to-be/analyse), maar
--                              past iets beter bij de koele, moderne
--                              slate-900 basis van Platform.
--
-- overlay_color       #020617  Slate-950 — donkerder dan primary #0f172a
--                              zodat modals contrast hebben tegen de UI.
--                              #0f172a als overlay zou niet te onderscheiden
--                              zijn van de achtergrond; #020617 geeft
--                              voldoende visueel onderscheid.
--
-- accent_light_color  #fff7ed  Orange-50. Licht oranje tint als zachte
--                              achtergrond bij accent-elementen — directe
--                              pendant van Kingfisher's #edf7e0 (licht
--                              groen), maar dan voor oranje.

UPDATE tenants
SET theme_config = jsonb_build_object(
  'brand_name',          'Platform',
  'product_name',        'Strategy Platform',
  'primary_color',       '#0f172a',
  'accent_color',        '#f97316',
  'accent_hover_color',  '#ea6c0a',
  'success_color',       '#2c7a4b',
  'analysis_color',      '#0ea5e9',
  'overlay_color',       '#020617',
  'accent_light_color',  '#fff7ed',
  'logo_url',            '/kf-logo.png',
  'logo_white_url',      '/kf-logo-white.png'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ── Kingfisher (Tenant 2) ────────────────────────────────────
--
-- Behoudt exacte huidige kleuren voor alle 5 nieuwe keys.

UPDATE tenants
SET theme_config = jsonb_build_object(
  'brand_name',          'Kingfisher',
  'product_name',        'Strategy Platform',
  'primary_color',       '#1a365d',
  'accent_color',        '#8dc63f',
  'accent_hover_color',  '#7ab52e',
  'success_color',       '#2c7a4b',
  'analysis_color',      '#00AEEF',
  'overlay_color',       '#001f33',
  'accent_light_color',  '#edf7e0',
  'logo_url',            '/kf-logo.png',
  'logo_white_url',      '/kf-logo-white.png'
)
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Verificatie
SELECT id, name, slug, theme_config FROM tenants ORDER BY name;
