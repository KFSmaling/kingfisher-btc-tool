-- ============================================================
-- Multi-tenant migratie 7/7 — Seed tenants, profielen, cleanup
--
-- Doel:
--   Alle bestaande testdata verwijderen, twee initiële tenants
--   aanmaken, gebruikersprofielen koppelen, en tenant_id
--   direct NOT NULL zetten (geen canvassen meer na cleanup).
--
-- Wat het doet (in volgorde):
--   §1  Alle canvasdata verwijderen
--       (guideline_analysis en guidelines eerst: geen CASCADE FK)
--       (canvases daarna: cascadeert de rest automatisch)
--       (orphan canvas_uploads: canvas_id IS NULL, niet gevangen door cascade)
--   §2  Twee tenants seeden met vaste UUIDs
--   §3a User-profiel voor Account 1 (Kees, Platform, platform_admin)
--   §3b Placeholder voor Account 2 — zie instructies daarin
--   §4  tenant_id direct NOT NULL zetten
--       (veilig: §1 heeft alle canvassen verwijderd, tabel is leeg)
--
-- Idempotentie:
--   §1 is veilig bij herhaald uitvoeren (DELETE WHERE levert 0 rijen
--      als tabellen al leeg zijn).
--   §2 is idempotent via ON CONFLICT (slug) DO NOTHING.
--   §3 is idempotent via ON CONFLICT (id) DO NOTHING.
--   §4 (ALTER NOT NULL) faalt als tabel niet leeg is — gewenste
--      veiligheidsblokkade.
--
-- Rollback (alleen relevant als je halverwege moet afbreken):
--   §4: ALTER TABLE canvases ALTER COLUMN tenant_id DROP NOT NULL;
--   §3: DELETE FROM user_profiles WHERE id IN ('<kees-uuid>', ...);
--   §2: DELETE FROM tenants WHERE slug IN ('platform', 'kingfisher');
-- ============================================================

-- ── §1: Alle testdata verwijderen ────────────────────────────
--
-- Volgorde is verplicht vanwege FK-constraints:
--
--   guideline_analysis → canvases (geen ON DELETE CASCADE → handmatig eerst)
--   guidelines         → canvases (geen ON DELETE CASCADE → handmatig eerst)
--   canvases           → cascade naar:
--                          canvas_uploads (met canvas_id)
--                          document_chunks
--                          import_jobs
--                          strategy_core
--                          analysis_items
--                          strategic_themes → ksf_kpi (cascade via theme_id)
--
-- Daarna: orphan canvas_uploads (canvas_id IS NULL, niet gevangen door cascade).

DELETE FROM guideline_analysis;
DELETE FROM guidelines;
DELETE FROM canvases;   -- cascadeert: uploads, chunks, jobs, strategy_core,
                        -- analysis_items, strategic_themes, ksf_kpi
DELETE FROM canvas_uploads WHERE canvas_id IS NULL;  -- orphans

-- ── §2: Initiële tenants seeden met vaste UUIDs ──────────────
--
-- Beide consultancy: dit is het actieve tenant-type voor beide accounts.
-- Vaste UUIDs (patroon 00...00X) voor herkenbaarheid in dumps en debug.

INSERT INTO tenants (id, tenant_type, name, slug, theme_config)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'consultancy',
    'Platform',
    'platform',
    '{}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'consultancy',
    'Kingfisher',
    'kingfisher',
    '{}'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── §3a: User-profiel voor Account 1 (Kees) ──────────────────
--
-- Hardcoded user_id uit Supabase Auth.
-- tenant_id: Platform (00...001)
-- role: platform_admin — volledige rechten over het platform.

INSERT INTO user_profiles (id, tenant_id, role)
VALUES (
  '5d76d65e-e102-4c33-bf45-d13fa4385537',       -- Kees, Auth UUID
  '00000000-0000-0000-0000-000000000001',         -- Kees Holding tenant
  'platform_admin'
)
ON CONFLICT (id) DO NOTHING;

-- ── §3b: Placeholder voor Account 2 (Gmail, tenant_admin op Kingfisher) ──
--
-- HOE IN TE VULLEN:
--   1. Maak Account 2 aan in Supabase Dashboard → Authentication →
--      Users → Invite user (gebruik je Gmail-adres).
--   2. Na aanmaken: kopieer de UUID die Supabase toekent.
--   3. Vervang 'VERVANG-MET-UUID-VAN-ACCOUNT-2' hieronder.
--   4. Voer dit INSERT-statement handmatig uit in de SQL Editor.
--      (Of herrun dit bestand — ON CONFLICT DO NOTHING is veilig.)
--
-- Zolang je dit niet invult: geen schade. Het INSERT doet niets
-- met een ongeldige UUID (FK naar auth.users zal falen als de
-- gebruiker niet bestaat — veiligheidsnet).

INSERT INTO user_profiles (id, tenant_id, role)
VALUES (
  'VERVANG-MET-UUID-VAN-ACCOUNT-2',              -- !! invullen na aanmaken Gmail-account
  '00000000-0000-0000-0000-000000000002',         -- Kingfisher tenant
  'tenant_admin'
)
ON CONFLICT (id) DO NOTHING;

-- ── §4: tenant_id NOT NULL zetten ────────────────────────────
--
-- Veilig omdat §1 de canvases tabel volledig heeft leeggemaakt.
-- Er zijn geen rijen met tenant_id IS NULL meer mogelijk.
-- Als §1 om wat voor reden is overgeslagen, faalt dit statement —
-- dat is de gewenste veiligheidsblokkade.

ALTER TABLE canvases
  ALTER COLUMN tenant_id SET NOT NULL;
