-- ============================================================
-- Theming seed — theme_config vullen voor beide tenants
--
-- Uitvoeren: handmatig in Supabase SQL Editor
-- Idempotent: UPDATE overschrijft altijd de volledige jsonb
-- ============================================================

-- Platform (Tenant 1)
UPDATE tenants
SET theme_config = jsonb_build_object(
  'brand_name',     'Platform',
  'product_name',   'Strategy Platform',
  'primary_color',  '#0f172a',
  'accent_color',   '#f97316',
  'logo_url',       '/kf-logo.png',
  'logo_white_url', '/kf-logo-white.png'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Kingfisher (Tenant 2)
UPDATE tenants
SET theme_config = jsonb_build_object(
  'brand_name',     'Kingfisher',
  'product_name',   'Strategy Platform',
  'primary_color',  '#1a365d',
  'accent_color',   '#8dc63f',
  'logo_url',       '/kf-logo.png',
  'logo_white_url', '/kf-logo-white.png'
)
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Verificatie
SELECT id, name, slug, theme_config FROM tenants ORDER BY name;
