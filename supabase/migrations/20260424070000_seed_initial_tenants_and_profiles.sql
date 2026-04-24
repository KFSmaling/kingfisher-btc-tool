-- ============================================================
-- Multi-tenant migratie 7/7 — Seed tenants, profielen, data-koppeling
--
-- Doel:
--   De initiële twee tenants aanmaken, bestaande users koppelen,
--   alle bestaande canvassen toewijzen aan de kingfisher-tenant,
--   orphan canvas_uploads opruimen, en tenant_id NOT NULL zetten.
--
-- Wat het doet (in volgorde):
--   §1  Orphan canvas_uploads verwijderen (canvas_id IS NULL)
--   §2  Twee tenants seeden met vaste UUIDs
--   §3a User-profiel voor Account 1 (iCloud, kingfisher, tenant_admin)
--   §3b User-profiel voor Account 2 (Gmail placeholder, platform, platform_admin)
--   §4  Bestaande canvassen koppelen aan kingfisher-tenant
--   §5  tenant_id NOT NULL zetten op canvases
--
-- VÓÓR UITVOEREN — controleer deze drie punten:
--
--   1. Voer de COUNT uit §1 handmatig uit in de Supabase SQL Editor.
--      Bevestig het getal voordat je het DELETE laat lopen.
--
--   2. Vervang 'VERVANG_DIT_MET_GMAIL_ADRES@gmail.com' (§3b) met het
--      echte Gmail-adres van Account 2. Zolang het adres niet in
--      auth.users bestaat doet de INSERT niets (veilig — subquery
--      retourneert geen rijen).
--
--   3. Controleer dat 'smaling.kingfisher@icloud.com' (§3a) overeenkomt
--      met het emailadres in Supabase Auth → Users.
--
-- Idempotentie:
--   §2 is idempotent (ON CONFLICT DO NOTHING op slug).
--   §3 is idempotent (ON CONFLICT DO NOTHING op id).
--   §4 updatet alleen rijen met tenant_id IS NULL — veilig om opnieuw
--      uit te voeren zolang §5 nog niet is gedraaid.
--   §5 (ALTER ... NOT NULL) faalt als er nog rijen zonder tenant_id
--      zijn — dat is de bedoelde veiligheidsblokkade.
--
-- Rollback (bewerkelijk na §5 — voer in omgekeerde volgorde uit):
--   ALTER TABLE canvases ALTER COLUMN tenant_id DROP NOT NULL;
--   UPDATE canvases SET tenant_id = NULL WHERE tenant_id =
--     '00000000-0000-0000-0000-000000000002';
--   DELETE FROM user_profiles WHERE tenant_id IN (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000002');
--   DELETE FROM tenants WHERE slug IN ('platform', 'kingfisher');
-- ============================================================

-- ── §1: Orphan canvas_uploads opruimen ───────────────────────
--
-- Controleer eerst het aantal (voer handmatig uit, bevestig):
--   SELECT COUNT(*) FROM canvas_uploads WHERE canvas_id IS NULL;
--
-- Verwacht: 0 of een klein getal. Ga pas verder als je dit getal kent.
-- Deze uploads zijn onbereikbaar na de nieuwe RLS in 005 — beter nu
-- netjes verwijderen.

DELETE FROM canvas_uploads
WHERE canvas_id IS NULL;

-- ── §2: Initiële tenants seeden met vaste UUIDs ──────────────
--
-- Vaste UUIDs zodat dit bestand idempotent is en §3/§4 ernaar kunnen
-- verwijzen zonder subquery. Patroon "00...00X" maakt ze herkenbaar
-- als seed-data in een dump of debugsessie.

INSERT INTO tenants (id, tenant_type, name, slug, theme_config)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'individual',
    'Platform Admin',
    'platform',
    '{}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'consultancy',
    'Kingfisher & Partners',
    'kingfisher',
    '{}'
  )
ON CONFLICT (slug) DO NOTHING;

-- ── §3a: User-profiel voor Account 1 (kingfisher, tenant_admin) ──
--
-- Zoekt de auth.users rij op via email; maakt user_profile aan.
-- Als het emailadres niet bestaat in auth.users, doet de INSERT niets.

INSERT INTO user_profiles (id, tenant_id, role)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000002',  -- kingfisher tenant
  'tenant_admin'
FROM auth.users au
WHERE au.email = 'smaling.kingfisher@icloud.com'
ON CONFLICT (id) DO NOTHING;

-- ── §3b: User-profiel voor Account 2 (platform, platform_admin) ──
--
-- !! VERVANG HET EMAILADRES HIERONDER met het echte Gmail-adres !!
-- Account 2 moet eerst aangemaakt zijn in Supabase Auth → Users
-- (via Invite user of signup). Daarna werkt deze INSERT.
-- Zolang het adres niet bestaat doet de INSERT niets — veilig.

INSERT INTO user_profiles (id, tenant_id, role)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000001',  -- platform tenant
  'platform_admin'
FROM auth.users au
WHERE au.email = 'VERVANG_DIT_MET_GMAIL_ADRES@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ── §4: Bestaande canvassen koppelen aan kingfisher-tenant ───
--
-- Alle canvassen die nog geen tenant_id hebben (= alle canvassen
-- van vóór deze migratie) worden toegewezen aan de kingfisher-tenant.
-- Canvassen van andere users (als die bestaan) krijgen ook deze tenant —
-- als je meerdere users hebt met canvassen die naar een andere tenant
-- moeten, voer dan eerst een handmatige check uit:
--
--   SELECT u.email, COUNT(c.id) as canvas_count
--   FROM canvases c
--   JOIN auth.users u ON c.user_id = u.id
--   WHERE c.tenant_id IS NULL
--   GROUP BY u.email;

UPDATE canvases
SET    tenant_id = '00000000-0000-0000-0000-000000000002'  -- kingfisher
WHERE  tenant_id IS NULL;

-- Controleer dat alle canvassen nu een tenant_id hebben
-- (voer handmatig uit voor je §5 draait):
--   SELECT COUNT(*) FROM canvases WHERE tenant_id IS NULL;
--   Verwacht: 0

-- ── §5: tenant_id NOT NULL maken ─────────────────────────────
--
-- Pas uitvoeren nadat §4 bevestigd is (COUNT = 0).
-- Als er nog rijen zonder tenant_id zijn, faalt deze stap —
-- dat is de bedoelde veiligheidsblokkade.

ALTER TABLE canvases
  ALTER COLUMN tenant_id SET NOT NULL;
