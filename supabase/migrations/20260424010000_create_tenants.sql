-- ============================================================
-- Multi-tenant migratie 1/7 — Tenants tabel
--
-- Doel:
--   De hoofd-entiteit voor tenant-isolatie aanmaken. Elke
--   organisatie (Kingfisher, toekomstige klanten) is één tenant.
--
-- Wat het doet:
--   - Maakt de `tenants` tabel aan met type-check, slug-uniekheid
--     en nullable kolommen voor toekomstige systemen
--   - Schakelt RLS in (policies volgen in 003 — hangen af van
--     user_profiles die in 002 wordt aangemaakt)
--
-- Afhankelijkheden: geen
--
-- Rollback (veilig zolang 002–007 nog niet zijn uitgevoerd):
--   DROP TABLE IF EXISTS tenants;
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type bepaalt billing-model en feature-entitlements (toekomst).
  -- Default 'consultancy' is het meest voorkomende type.
  tenant_type      text        NOT NULL DEFAULT 'consultancy'
                               CHECK (tenant_type IN ('consultancy', 'enterprise', 'individual')),

  name             text        NOT NULL,

  -- URL-safe identifier, platform-breed uniek.
  -- Wordt gebruikt in routing en admin-UI.
  slug             text        NOT NULL,

  -- Hiërarchie: consultancy-firma kan klant-tenants hebben als children.
  -- Geen REFERENCES-constraint: hiërarchie-logica wordt later geactiveerd.
  parent_tenant_id uuid,

  -- JSON met brand-tokens (kleuren, logo-URLs, fonts).
  -- Structuur: zie docs/architecture-spec.md §5.1
  -- Leeg object is default; L1-theming is optioneel per tenant.
  theme_config     jsonb       NOT NULL DEFAULT '{}',

  -- Toekomstige FK naar content_packs tabel (bestaat nog niet).
  content_pack_id  uuid,

  -- Toekomstige FK naar subscriptions tabel / Stripe (bestaat nog niet).
  subscription_id  uuid,

  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

-- RLS inschakelen; policies worden toegevoegd in 003_helper_functions.sql
-- (ze hangen af van user_profiles en current_tenant_id() die dan bestaan).
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
