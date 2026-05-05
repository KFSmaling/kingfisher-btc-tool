-- ============================================================
-- Stap 7 — Fase 7b: TLB enterprise-tenant + test-user koppeling
--
-- V1: slug='tlb-test', name='TLB', tenant_type='enterprise'
-- V2: theme_config met 8 kleuren (TLB-officieel + 2 gegokte tints) + 2 logo-URLs
-- V3: tenant_content met framework_clause leeg, brand_clause=" bij TLB",
--     industry_clause=" voor HNW financial services"
-- V4: Scenario A — geen nieuwe block_definitions; TLB gebruikt globale
--     BTC-blokken via get_block_definitions_for_tenant() RPC.
-- V5: user_profiles-rij voor UUID f2594450-2d96-4a69-9670-f3953edff273
--     gekoppeld aan TLB-tenant met role='tenant_user' (geen platform_admin).
--     Reviewer-instructie 2210 schreef 'user' — niet toegestaan door
--     user_profiles_role_check (allowed: platform_admin / tenant_admin /
--     tenant_user / end_client_user). 'tenant_user' is de obvious match
--     voor "non-admin user".
--
-- Idempotent: ON CONFLICT (slug)/(id) DO UPDATE.
-- ============================================================

INSERT INTO tenants (slug, name, tenant_type, theme_config, tenant_content)
VALUES (
  'tlb-test',
  'TLB',
  'enterprise',
  '{
    "brand_name":          "TLB",
    "primary_color":       "#281805",
    "accent_color":        "#A06B3C",
    "accent_hover_color":  "#885B33",
    "success_color":       "#0B3F2D",
    "analysis_color":      "#1D2550",
    "overlay_color":       "#281805",
    "accent_light_color":  "#F5E8D4",
    "logo_url":            "https://www.transamericalifebermuda.com/sites/default/files/tlb-logo.svg",
    "logo_white_url":      "https://www.transamericalifebermuda.com/sites/default/files/tlb-logo.svg"
  }'::jsonb,
  '{
    "brand_name":              "TLB",
    "framework_name":          "het strategische raamwerk",
    "brand_clause":            " bij TLB",
    "framework_clause":        "",
    "industry_clause":         " voor HNW financial services",
    "example_segments_clause": ""
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET name           = EXCLUDED.name,
    tenant_type    = EXCLUDED.tenant_type,
    theme_config   = EXCLUDED.theme_config,
    tenant_content = EXCLUDED.tenant_content;

-- user_profiles rij koppelen aan TLB-tenant
INSERT INTO user_profiles (id, tenant_id, role)
SELECT
  'f2594450-2d96-4a69-9670-f3953edff273'::uuid,
  t.id,
  'tenant_user'
FROM tenants t
WHERE t.slug = 'tlb-test'
ON CONFLICT (id) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    role      = EXCLUDED.role;
