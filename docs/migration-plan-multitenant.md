# Migratie-plan: Multi-tenancy introductie

> Plan op basis van `docs/schema-inventory.md` en `docs/architecture-spec.md` §4.  
> Geen SQL — alleen ontwerp, rationale en volgorde.  
> Status: concept — open vragen onderaan vereisen bevestiging vóór implementatie.  
> Opgesteld: 2026-04-24

---

## Uitgangspositie

Het huidige schema isoleert data op user-niveau: elke rij is direct (via `user_id`) of indirect (via `canvas_id → canvases.user_id`) eigendom van één Supabase Auth-gebruiker. Er is geen groepering boven de user — geen organisatie, firma of tenant.

De architectuurspec vereist tenant-isolatie als fundament, ook met één actieve gebruiker. Dit plan introduceert die laag incrementeel zonder bestaande data te breken.

---

## 1. De `tenants` tabel

De spec definieert een uitgebreide `tenants` tabel inclusief `subscription_id` en `content_pack_id`. Beide systemen bestaan nog niet in de codebase. Voor deze migratie geldt: bouw de kolommen die nu zinvol zijn, reserveer de rest als nullable foreign keys die later worden ingevuld.

**Voorgesteld schema:**

```
tenants
──────────────────────────────────────────────
id             uuid          PRIMARY KEY
tenant_type    text          NOT NULL CHECK (tenant_type IN ('consultancy','enterprise','individual'))
name           text          NOT NULL
slug           text          UNIQUE NOT NULL
parent_tenant_id uuid        REFERENCES tenants(id)  -- nullable, voor hiërarchie (firma → klant)
theme_config   jsonb         DEFAULT '{}'
content_pack_id uuid         -- nullable FK, invullen zodra content_packs bestaat
subscription_id uuid         -- nullable FK, invullen zodra subscriptions bestaat
created_at     timestamptz   DEFAULT now()
```

**Toelichting per kolom:**

- `tenant_type` — drie typen zoals in de spec. Nu alleen `consultancy` actief; enum maakt uitbreiding zonder migratie mogelijk.
- `slug` — URL-safe identifier (`kingfisher`, `klant-abc`). Wordt gebruikt in subdomain routing en admin-UI. Uniek platform-breed.
- `parent_tenant_id` — voor het consultancy-model: de firma-tenant is de parent van klant-tenants. Voor nu nullable; de hiërarchie zetten we pas op als we meerdere klant-tenants aanmaken.
- `theme_config` — JSON conform spec §5.1 (brand-kleuren, fonts, logo-URLs). Leeg object als default; L1-theming is daarmee optioneel per tenant.
- `content_pack_id`, `subscription_id` — aanwezig als nullable kolom, zodat de tabel niet opnieuw gemigreerd hoeft te worden wanneer die systemen er komen. Nu altijd NULL.

**Twee tenants die onmiddellijk bestaan na de seed:**

| slug | name | type | rol |
|------|------|------|-----|
| `platform` | Platform Admin | `individual` | Technische admin (jij als developer) |
| `kingfisher` | Kingfisher & Partners | `consultancy` | Eerste productie-tenant |

Bestaande canvassen worden aan de `kingfisher`-tenant toegewezen (zie §5 — migratievolgorde).

---

## 2. User-tenant koppeling: `user_profiles`-tabel (aanbeveling)

Er zijn twee gangbare patronen om een Supabase Auth-gebruiker aan een tenant te koppelen:

**Optie A — `user_profiles`-tabel** (aanbevolen)

Een aparte tabel in de public schema die `auth.users.id` koppelt aan een `tenant_id` en een `role`:

```
user_profiles
──────────────────────────────────────────────
id          uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
tenant_id   uuid    NOT NULL REFERENCES tenants(id)
role        text    NOT NULL CHECK (role IN ('platform_admin','tenant_admin','tenant_user','end_client_user'))
preferences jsonb   DEFAULT '{}'
created_at  timestamptz DEFAULT now()
```

De helper-functie `current_tenant_id()` doet een SELECT op deze tabel: `SELECT tenant_id FROM user_profiles WHERE id = auth.uid()`.

**Optie B — JWT custom claim** (`app_metadata.tenant_id`)

Supabase Auth staat toe dat `tenant_id` als claim wordt opgeslagen in de JWT via `raw_app_meta_data`. De helper-functie leest dan: `(auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid`. Dit vermijdt een join in elke RLS-policy.

**Waarom Optie A:**

1. **Fase 1 — eenvoud.** JWT custom claims via Supabase vereisen een Auth Hook (access token hook), een relatief nieuwe feature met extra configuratie. De `user_profiles`-tabel werkt met standaard SQL en RLS-patronen die al in het project aanwezig zijn.

2. **Debuggeerbaarheid.** Een rij in een tabel is direct zichtbaar via de Supabase Dashboard. Een JWT-claim is pas zichtbaar na token-decode.

3. **Onmiddellijk van kracht.** Een wijziging van `tenant_id` in `user_profiles` werkt bij de volgende query. Een claim-wijziging werkt pas na re-login of token-refresh — dit wordt een bug-magneet bij rolwisselingen.

4. **Querybaar.** Admin-overzichten ("welke users horen bij welke tenant?") zijn gewone SQL-queries. Met JWT-claims zou dit een aparte admin-API vereisen.

5. **Migreerbaar.** Als we later, om performance-redenen, willen overstappen naar JWT-claims, is dat een gerichte optimalisatie — `current_tenant_id()` is het enige raakpunt.

**Spec-afwijking:** de architectuurspec tekent een `users`-tabel met alle user-attributen. We noemen dit `user_profiles` en beperken het tot de platform-relevante velden (tenant_id, role, preferences). Authenticatie-data (email, wachtwoord) blijft uitsluitend in `auth.users`. Dit is in lijn met Supabase best practices.

---

## 3. De helper-functie `current_tenant_id()`

Alle RLS-policies die tenant-isolatie afdwingen, roepen deze functie aan. Dit voorkomt dat de join-logica op tien plaatsen wordt herhaald en maakt een latere optimalisatie (overstap naar JWT-claim) transparant: alleen de functie-body verandert, policies blijven ongewijzigd.

**Gedrag:**

```
current_tenant_id()
  → SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
  → retourneert uuid van de tenant van de ingelogde gebruiker
  → retourneert NULL als de user geen profiel heeft (niet uitgenodigd)
```

**Aandachtspunt — recursie:** `user_profiles` heeft zelf RLS. Als de policy op `user_profiles` `current_tenant_id()` aanroept, ontstaat een oneindige recursie. De oplossing: de RLS-policy op `user_profiles` gebruikt géén `current_tenant_id()` maar filtert direct op `id = auth.uid()` (een user mag alleen zijn eigen profiel lezen). `current_tenant_id()` wordt gedefinieerd met `SECURITY DEFINER` zodat hij de RLS van `user_profiles` omzeilt bij het opvragen van de tenant.

**`platform_admin`-uitzondering:** platform_admins moeten cross-tenant kunnen lezen voor beheer-doeleinden. Dit regelen we niet via de gewone RLS-policies maar via een aparte role-check in admin-endpoints (buiten de app). De normale app-RLS blijft altijd tenant-gefilterd — ook voor platform_admins wanneer ze als gewone gebruiker werken.

---

## 4. Per-tabel wijzigingen

De kern van de migratie is smal: alleen `canvases` krijgt een nieuwe kolom en een nieuwe RLS-policy. Alle downstream-tabellen lopen via de canvas-join en erven de tenant-isolatie automatisch — mits we de canvas-policy goed ontwerpen.

### 4.1 `canvases` — kolom toevoegen + policy aanpassen

**Wijziging:** `tenant_id uuid NOT NULL REFERENCES tenants(id)` toevoegen.

De huidige RLS-policy is `user_id = auth.uid()`. We vervangen dit door een combinatie:

```
(tenant_id = current_tenant_id()) AND (user_id = auth.uid())
```

Dit handhaaft twee niveaus tegelijk:
- Tenant-isolatie: een canvas van tenant A is nooit zichtbaar voor tenant B.
- User-isolatie: consultants zien alleen hun eigen canvassen, niet die van collega's.

Dit is de conservatieve keuze voor Fase 1. Canvas-deling binnen een tenant (team-gebruik) kan later worden ingeschakeld door de `user_id`-conditie te versoepelen, zonder de tenant-isolatie aan te raken.

**Open vraag #1** (zie §7 onderaan).

### 4.2 `canvas_uploads` — policy aanpassen, geen nieuwe kolom

`canvas_uploads` heeft `user_id` én `canvas_id`. De huidige policy filtert direct op `user_id = auth.uid()`. Na de migratie is het logischer en consistenter om via de canvas te filteren:

```
canvas_id IN (SELECT id FROM canvases WHERE tenant_id = current_tenant_id() AND user_id = auth.uid())
```

Geen structuurwijziging — alleen policy-update.

### 4.3 `import_jobs` — policy aanpassen, geen nieuwe kolom

Zelfde situatie als `canvas_uploads`. Policy omzetten naar canvas-join. `user_id` blijft als attribuut staan (wie heeft de import gestart) maar stuurt niet meer de RLS.

### 4.4 `document_chunks` — geen wijziging

Filtert al via `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())`. Na aanpassing van de canvas-policy volstaat het om de subquery daar op tenant + user te filteren. Optioneel: de subquery in document_chunks updaten naar dezelfde formulering als canvas_uploads voor consistentie.

### 4.5 `strategy_core`, `analysis_items`, `strategic_themes`, `guidelines`, `guideline_analysis` — geen wijziging

Alle vijf filteren via `canvas_id IN (SELECT id FROM canvases WHERE user_id = auth.uid())`. Ze erven tenant-isolatie via de canvas-join. Geen kolom of policy-wijziging nodig.

### 4.6 `ksf_kpi` — geen wijziging

Filtert via theme → canvas → user. Erft tenant-isolatie via de keten. Geen wijziging nodig.

### 4.7 `app_config` — niet aanraken

Platform-breed. Geen tenant_id. Policies ongewijzigd (SELECT voor authenticated, UPDATE voor admin).

### Overzicht

| Tabel | Kolom toevoegen | Policy aanpassen | Reden geen wijziging |
|-------|----------------|-----------------|---------------------|
| `tenants` | — (nieuw) | — | Nieuw |
| `user_profiles` | — (nieuw) | — | Nieuw |
| `canvases` | `tenant_id` ✅ | ✅ | Root-entiteit |
| `canvas_uploads` | ❌ | ✅ | Policy via canvas herzien |
| `import_jobs` | ❌ | ✅ | Policy via canvas herzien |
| `document_chunks` | ❌ | Optioneel | Erft via canvas |
| `strategy_core` | ❌ | ❌ | Erft via canvas |
| `analysis_items` | ❌ | ❌ | Erft via canvas |
| `strategic_themes` | ❌ | ❌ | Erft via canvas |
| `ksf_kpi` | ❌ | ❌ | Erft via theme → canvas |
| `guidelines` | ❌ | ❌ | Erft via canvas |
| `guideline_analysis` | ❌ | ❌ | Erft via canvas |
| `app_config` | ❌ | ❌ | Platform-breed, niet aanraken |

---

## 5. Volgorde van migratiebestanden

Zeven bestanden, elk idempotent. Ze bouwen op elkaar — volgorde is verplicht.

```
20260424_001_create_tenants.sql
20260424_002_create_user_profiles.sql
20260424_003_current_tenant_id_function.sql
20260424_004_add_tenant_id_to_canvases.sql
20260424_005_update_canvas_uploads_rls.sql
20260424_006_update_import_jobs_rls.sql
20260424_007_seed_initial_tenants_and_profiles.sql
```

**Bestand 001 — `create_tenants`**
Maakt de `tenants`-tabel aan. Geen afhankelijkheden. Geen data nog.

**Bestand 002 — `create_user_profiles`**
Maakt `user_profiles` aan. Afhankelijk van `tenants` (foreign key). Geen data nog. RLS-policy die direct `id = auth.uid()` gebruikt (geen `current_tenant_id()`).

**Bestand 003 — `current_tenant_id_function`**
Maakt de `current_tenant_id()` helper aan als `SECURITY DEFINER`. Afhankelijk van `user_profiles`. Geen data-wijzigingen.

**Bestand 004 — `add_tenant_id_to_canvases`**
Voegt `tenant_id uuid REFERENCES tenants(id)` toe als nullable kolom (NOT NULL kunnen we pas na de seed in 007). Vervangt de RLS-policy op `canvases`. Afhankelijk van 001 en 003.

**Bestand 005 — `update_canvas_uploads_rls`**
Vervangt de RLS-policy op `canvas_uploads` van directe user_id-check naar canvas-join.

**Bestand 006 — `update_import_jobs_rls`**
Zelfde als 005 voor `import_jobs`.

**Bestand 007 — `seed_initial_tenants_and_profiles`**
Doet vier dingen in volgorde:
1. INSERT `platform`-tenant
2. INSERT `kingfisher`-tenant
3. INSERT `user_profiles`-rijen voor beide Supabase Auth-gebruikers (UUID's hardcoded of via subquery op `auth.users.email`)
4. UPDATE `canvases SET tenant_id = <kingfisher-id>` voor alle bestaande rijen
5. ALTER TABLE `canvases ALTER COLUMN tenant_id SET NOT NULL` (pas na de UPDATE veilig)

**Risico bij stap 5:** als er canvassen bestaan met een `user_id` die niet bij de `kingfisher`-tenant zit, moet de UPDATE expliciet matchen op de user UUID van Kees. Dat is traceerbaar via `auth.users`.

---

## 6. Test-scenario: twee tenants, twee logins

**Doel:** verifiëren dat RLS-isolatie werkt — tenant A ziet niets van tenant B, ook niet via directe tabel-queries.

**Setup:**

| Account | Email | Tenant | Role |
|---------|-------|--------|------|
| Account 1 | `smaling.kingfisher@icloud.com` (huidig) | `kingfisher` | `tenant_admin` |
| Account 2 | nieuw aan te maken | `platform` | `platform_admin` |

**Waarom een tweede Supabase Auth-gebruiker aanmaken en niet impersoneren?**

Impersonatie (Supabase Dashboard → "Impersonate user") werkt voor debuggen, maar genereert een JWT met het impersonated user's `uid`. Dit verifieert niet of de `user_profiles`-koppeling correct werkt voor een echte login. Echte inlog via een tweede account test de volledige flow: signup → `user_profiles`-rij aanmaken → JWT ophalen → `current_tenant_id()` correct retourneren.

**Aanmaakvolgorde:**
1. Maak Account 2 aan via Supabase Authentication → Users → Invite user (of via app signup als die flow er is). 
2. Voer bestand 007 uit — dit seeded de `user_profiles`-rij voor Account 2 op basis van email-subquery.
3. Log in als Account 2, open de app: er zijn geen canvassen zichtbaar (isolatie werkt).
4. Log in als Account 1, maak een canvas aan: zichtbaar voor Account 1, niet voor Account 2.

**Verificatietest na elke stap:**
```
-- Als Account 1 ingelogd (kingfisher-tenant):
SELECT id, name FROM canvases;          -- toont eigen canvassen
SELECT current_tenant_id();             -- toont kingfisher UUID

-- Als Account 2 ingelogd (platform-tenant):
SELECT id, name FROM canvases;          -- toont niets
SELECT current_tenant_id();             -- toont platform UUID
```

**Platform_admin cross-tenant toegang:** dit regelen we expliciet níét via de app-RLS. Voor beheer-queries gebruiken we de Supabase service-role key (alleen via Supabase Dashboard of Edge Functions). De `platform_admin`-rol in `user_profiles` is nu alleen een label — de daadwerkelijke rechten volgen in een latere migratie als we een admin-panel bouwen.

---

## 7. Open vragen

Deze vragen moeten beantwoord zijn voordat migratie-bestand 004 wordt geschreven.

**Vraag 1 — Canvas-zichtbaarheid binnen tenant**

De voorgestelde RLS op `canvases` is:
```
tenant_id = current_tenant_id() AND user_id = auth.uid()
```
Dit betekent: een consultant ziet alleen zijn eigen canvassen, niet die van collega's binnen dezelfde tenant.

Alternatief:
```
tenant_id = current_tenant_id()
```
Dit betekent: alle tenant-leden zien alle canvassen — ook die van collega's.

*Welk model wil je nu?* Voor Fase 1 (één gebruiker per tenant) maakt het geen praktisch verschil, maar het stuurt wel welke kant we op gaan bij team-gebruik.

**Vraag 2 — `tenant_type` nu of later**

De spec definieert drie types: `consultancy`, `enterprise`, `individual`. Wil je dit als NOT NULL enum direct invoeren (met `kingfisher` als `consultancy` en `platform` als `individual`), of als nullable kolom die later wordt ingevuld?

*Voordeel direct*: type-veilig van het begin af. *Nadeel*: als we later een vierde type willen, is een nieuwe migratie nodig om de CHECK-constraint aan te passen.

**Vraag 3 — `parent_tenant_id` nu of later**

De spec tekent een hiërarchie: firma-tenant → klant-tenant. Dit is relevant zodra Kingfisher externe klant-tenants aanmaakt. Nu is er geen klant-tenant — `parent_tenant_id` zou altijd NULL zijn.

*Advies*: kolom nu al toevoegen als nullable (kost niets, voorkomt toekomstige migratie), maar de hiërarchie-logica nog niet inbouwen.

*Akkoord?*

**Vraag 4 — UUID van Account 2**

Het seed-bestand 007 moet een `user_profiles`-rij aanmaken voor het tweede account. Dat kan via:
- Hardcoded UUID (weet je pas na aanmaken van het account)
- Subquery op `auth.users WHERE email = 'tweede-email@...'`

*Welk emailadres wil je gebruiken voor Account 2?* Zet je dit aan als een tweede iCloud alias, of een apart Gmail-account?

**Vraag 5 — Bestaande `canvas_uploads` zonder `canvas_id`**

De migratie-inventaris laat zien dat `canvas_uploads.canvas_id` nullable is (geen NOT NULL). Er kunnen rijen bestaan zonder canvas-koppeling. Na de policy-aanpassing in bestand 005 zijn die rijen niet meer bereikbaar via RLS.

*Is het risico acceptabel (wees je ervan bewust), of wil je de orphan-uploads eerst opruimen?*

---

## Wat dit plan niet dekt

- **Content packs** — `tenants.content_pack_id` blijft NULL totdat het content-pack-systeem is gebouwd.
- **Subscriptions** — `tenants.subscription_id` blijft NULL totdat Stripe is gekoppeld.
- **Platform_admin cross-tenant beheer** — volgt bij admin-paneel sprint.
- **Canvas-deling binnen tenant** — volgt bij team-gebruik sprint.
- **RLS-tests** — de spec vereist unit-tests per role en tenant-type. Scope voor een aparte sprint.
