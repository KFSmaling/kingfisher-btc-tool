# Migratie-plan: Multi-tenancy introductie

> Plan op basis van `docs/schema-inventory.md` en `docs/architecture-spec.md` §4.  
> Status: **beslissingen verwerkt** — klaar voor implementatie.  
> Opgesteld: 2026-04-24 | Bijgewerkt: 2026-04-24 (besluiten verwerkt)

---

## Uitgangspositie

Het huidige schema isoleert data op user-niveau: elke rij is direct (via `user_id`) of indirect (via `canvas_id → canvases.user_id`) eigendom van één Supabase Auth-gebruiker. Er is geen groepering boven de user — geen organisatie, firma of tenant.

De architectuurspec vereist tenant-isolatie als fundament, ook met één actieve gebruiker. Dit plan introduceert die laag incrementeel zonder bestaande data te breken.

---

## Genomen besluiten (2026-04-24)

| # | Vraag | Besluit |
|---|-------|---------|
| 1 | Canvas-zichtbaarheid | User ziet eigen canvassen; `tenant_admin` ziet alle canvassen binnen tenant. RLS-policy: `tenant_id = current_tenant_id() AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin')` |
| 2 | `tenant_type` | NOT NULL enum, `CHECK (tenant_type IN ('consultancy','enterprise','individual'))`, default `'consultancy'` |
| 3 | `parent_tenant_id` | Toevoegen als nullable uuid kolom, **geen FK-constraint** (hiërarchie-logica later) |
| 4 | Account 2 | Apart Gmail-adres — eigenaar maakt het aan. Seed-bestand bevat placeholder `'VERVANG_DIT_MET_GMAIL_ADRES@gmail.com'` |
| 5 | Orphan `canvas_uploads` | Opruimen vóór migratie met DELETE. Seed-bestand toont COUNT-instructie ter bevestiging eerst |
| + | Extra | `current_user_role()` helper-functie toevoegen (SECURITY DEFINER, leest `user_profiles`) |

---

## 1. De `tenants` tabel

```
tenants
──────────────────────────────────────────────
id               uuid        PRIMARY KEY DEFAULT gen_random_uuid()
tenant_type      text        NOT NULL DEFAULT 'consultancy'
                             CHECK ('consultancy' | 'enterprise' | 'individual')
name             text        NOT NULL
slug             text        UNIQUE NOT NULL
parent_tenant_id uuid        -- nullable, geen FK-constraint (bewust)
theme_config     jsonb       NOT NULL DEFAULT '{}'
content_pack_id  uuid        -- nullable, FK zodra content_packs bestaat
subscription_id  uuid        -- nullable, FK zodra subscriptions bestaat
created_at       timestamptz NOT NULL DEFAULT now()
```

`tenant_type` is NOT NULL met default `'consultancy'` — meest voorkomende type. `parent_tenant_id` heeft bewust geen REFERENCES-constraint; de hiërarchie-logica wordt ingeschakeld zodra dat model gebouwd is. `content_pack_id` en `subscription_id` zijn aanwezig als nullable kolommen zodat de tabel later niet opnieuw gemigreerd hoeft te worden.

RLS op `tenants`: een user mag zijn eigen tenant lezen (`id = current_tenant_id()`). Schrijven loopt uitsluitend via service role (migraties, toekomstig admin-paneel).

---

## 2. User-tenant koppeling: `user_profiles`-tabel

**Gekozen: `user_profiles`-tabel, niet JWT custom claim.**

```
user_profiles
──────────────────────────────────────────────
id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT
role        text        NOT NULL DEFAULT 'tenant_user'
                        CHECK ('platform_admin' | 'tenant_admin' | 'tenant_user' | 'end_client_user')
preferences jsonb       NOT NULL DEFAULT '{}'
created_at  timestamptz NOT NULL DEFAULT now()
```

Rationale voor tabel boven JWT-claims: direct van kracht bij rol-wijziging (JWT-claims werken pas na re-login), debuggeerbaar via Supabase Dashboard, querybaar voor admin-overzichten, en geen Auth Hook configuratie nodig. JWT-claims zijn een latere optimalisatie als performance dit vereist.

RLS op `user_profiles`: directe `id = auth.uid()` check — geen `current_tenant_id()` om recursie te voorkomen. UPDATE-rechten beperkt tot eigen rij. Kolom-level bescherming (voorkomen dat user eigen `role` aanpast) via `service_role` voor admin-acties.

---

## 3. Helper-functies

Beide functies zijn `SECURITY DEFINER` en `STABLE`. `SECURITY DEFINER` vermijdt recursie: als `user_profiles` RLS heeft en de policy `current_tenant_id()` zou aanroepen, roept die functie `user_profiles` op terwijl de policy van `user_profiles` zelf actief is. Met `SECURITY DEFINER` bypassed de functie de RLS van `user_profiles`.

```
current_tenant_id()  →  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
current_user_role()  →  SELECT role       FROM user_profiles WHERE id = auth.uid()
```

Beide retourneren `NULL` als de user geen profiel heeft. Alle toekomstige RLS-policies gebruiken uitsluitend deze functies — bij een eventuele latere switch naar JWT-claims hoeven alleen de function-bodies te worden aangepast.

---

## 4. Per-tabel wijzigingen

### `canvases` — kolom + policy

`tenant_id uuid REFERENCES tenants(id)` wordt toegevoegd als nullable (NOT NULL pas ná seed). Index op `tenant_id` voor RLS-performance.

Nieuwe policy (FOR ALL):
```
USING:      tenant_id = current_tenant_id()
            AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin')

WITH CHECK: tenant_id = current_tenant_id()
            AND (user_id = auth.uid() OR current_user_role() = 'tenant_admin')
```

**Kanttekening:** downstream tabellen (`strategy_core`, `analysis_items`, etc.) filteren via `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())`. Die subquery werkt correct voor `tenant_user`. Voor `tenant_admin` die canvassen van collega's wil benaderen zijn de downstream-policies te restrictief — dit wordt opgelost in de canvas-sharing sprint (buiten scope nu).

### `canvas_uploads` — policy aanpassen

Van directe `user_id = auth.uid()` naar canvas-join:
```sql
canvas_id IN (
  SELECT id FROM canvases
  WHERE  tenant_id = current_tenant_id()
  AND    (user_id = auth.uid() OR current_user_role() = 'tenant_admin')
)
```

### `import_jobs` — policy aanpassen

Zelfde patroon als `canvas_uploads`.

### Overige tabellen — geen wijziging

| Tabel | Wijziging | Reden |
|-------|-----------|-------|
| `tenants` | — (nieuw) | |
| `user_profiles` | — (nieuw) | |
| `canvases` | `tenant_id` kolom + policy ✅ | Root-entiteit |
| `canvas_uploads` | Policy ✅ | Via canvas |
| `import_jobs` | Policy ✅ | Via canvas |
| `document_chunks` | ❌ | Erft via canvas |
| `strategy_core` | ❌ | Erft via canvas |
| `analysis_items` | ❌ | Erft via canvas |
| `strategic_themes` | ❌ | Erft via canvas |
| `ksf_kpi` | ❌ | Erft via theme→canvas |
| `guidelines` | ❌ | Erft via canvas |
| `guideline_analysis` | ❌ | Erft via canvas |
| `app_config` | ❌ | Platform-breed, niet aanraken |

---

## 5. Migratiebestanden — volgorde

```
supabase/migrations/
  20260424010000_create_tenants.sql
  20260424020000_create_user_profiles.sql
  20260424030000_helper_functions.sql
  20260424040000_add_tenant_id_to_canvases.sql
  20260424050000_update_canvas_uploads_rls.sql
  20260424060000_update_import_jobs_rls.sql
  20260424070000_seed_initial_tenants_and_profiles.sql
```

**Volgorde is verplicht.** Elk bestand hangt af van het vorige:
- 001: geen afhankelijkheden
- 002: `tenants` (FK op tenant_id)
- 003: `user_profiles` (functies lezen die tabel); voegt ook tenants-RLS toe
- 004: `tenants` + helper-functies
- 005–006: nieuwe canvases-policy (004)
- 007: alle eerdere tabellen bestaan; zet als laatste NOT NULL op canvases.tenant_id

**Aandachtspunt voor 007:** het seed-bestand verwijst naar een placeholder-emailadres voor account 2. Vervang `'VERVANG_DIT_MET_GMAIL_ADRES@gmail.com'` met het echte adres vóór uitvoeren. Zolang het adres niet in `auth.users` bestaat doet de INSERT niets (veilig).

---

## 6. Test-scenario

Twee Supabase Auth-accounts, twee tenants:

| Account | Email | Tenant (slug) | Role |
|---------|-------|--------------|------|
| Account 1 | `smaling.kingfisher@icloud.com` | `kingfisher` | `tenant_admin` |
| Account 2 | nader in te vullen Gmail | `platform` | `platform_admin` |

**Verificatie na uitvoeren (in Supabase SQL Editor):**
```sql
-- Als Account 1 (kingfisher):
SELECT current_tenant_id();   -- → '00000000-0000-0000-0000-000000000002'
SELECT current_user_role();   -- → 'tenant_admin'
SELECT id, name FROM canvases; -- → eigen canvassen

-- Als Account 2 (platform):
SELECT current_tenant_id();   -- → '00000000-0000-0000-0000-000000000001'
SELECT id, name FROM canvases; -- → leeg (geen canvassen in platform-tenant)
```

`platform_admin` cross-tenant beheer loopt via service role (Supabase Dashboard), niet via app-RLS. De rol is nu een label; rechten worden uitgewerkt bij de admin-paneel sprint.

---

## Wat dit plan niet dekt

- Content packs en subscriptions — kolommen bestaan, logica volgt later
- Platform_admin cross-tenant beheer via app — eigen sprint
- Canvas-deling binnen tenant (`tenant_admin` ziet canvassen van collega's via app) — downstream-policies aanpassen is een aparte sprint
- RLS unit-tests per role/tenant — spec vereist dit, volgt als aparte sprint
