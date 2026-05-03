# 01 — Spec-gap

**Audit-datum:** 2026-05-03 (fase 2)
**Branch:** `audit/2026-05-03-fase2`
**Meetlat:** `docs/architecture-spec.md` (versie 1.0, integraal)
**Bron-as-is:** fase 1 (`docs/audit/2026-05-01/01-functioneel.md` t/m `05-tech-debt-aanvulling.md`)

**Doel:** per spec-sectie vaststellen of er een gap is tussen wat de spec voorschrijft en wat de codebase nu doet. Per gap: spec-regel, werkelijkheid (met verwijzing), remediatie-klasse, severity met motivatie.

**Klasse-definities (gebruikt in dit document):**
- **docs-update** — spec is achterhaald; werkelijkheid is bewust afgeweken en moet in spec geland worden
- **config-shift** — verplaatsing van hardcoded → DB, of global → tenant-scoped
- **schema-uitbreiding** — nieuwe tabellen/kolommen nodig zonder grote herontwerp
- **herontwerp** — fundamenteel grotere ingreep dan een config-shift
- **beslissing nodig** — spec en werkelijkheid wijken af; richting is een Kees-keuze, niet een uitvoering

**Severity-definities:**
- **L (laag)** — kosmetisch, of binnen huidige fase 1 acceptabel
- **M (medium)** — blokkeert spec-doel maar niet acuut
- **H (hoog)** — blokkeert kern-belofte (multi-tenant, methode-agnostisch, IP-bescherming)

---

## §1 Bedrijfsstrategie

Sectie 1 beschrijft positionering, verdienmodel, principes en ambitietijdlijn. Geen technische verplichtingen die direct in code-gap te toetsen zijn. **Wel** twee strategische principes (§1.3) die in latere secties geoperationaliseerd worden:

| Principe | Waar getoetst |
|---|---|
| "Platform, geen project" | §2.4 (firma-aannames) + §6.3 (content packs) |
| "Methode-agnostisch blijven" | §2.4 + §6 (content packs) |
| "Content scheiden van capability" | §2.1 (drie-lagen) + §6 |
| "IP-eigenaarschap als design-constraint" | §2.4 + §6.3 |
| "Productkwaliteit boven feature-volume" | niet code-toetsbaar |
| "Operationele eenvoud" | §3 (tech stack) — bewust een-ontwikkelaar-keuzes |

Geen aparte gap hier — doorverwezen naar §2/§4/§6.

---

## §2 Architecturale kernprincipes

### §2.1 — Drie-lagen-scheiding (platform / content / brand)

**Spec:** drie duidelijk gescheiden lagen. Brand per tenant aanpasbaar; content per tenant configureerbaar; platform onveranderlijk en uniform.

**Werkelijkheid:**
| Laag | Status | Bewijs (fase 1) |
|---|---|---|
| Brand layer | ✅ tenant-scoped | 02-architectuur §6 + 03-namen-en-termen §13 — `tenants.theme_config` met 10 keys, ThemeProvider injecteert CSS-vars |
| Content layer | ❌ **global, niet tenant-scoped** | 01-functioneel §13 ("`app_config` is global, niet tenant-scoped") + 03-namen-en-termen §1 Laag 2b ("`app_config` is NIET tenant-scoped — global voor alle tenants") |
| Platform layer | ✅ uniform | impliciet — geen tenant-specifieke code-paden geconstateerd |

**Gap (S-1):** Content-laag is niet tenant-scoped. Alle prompts, alle UI-labels en alle setting-keys gelden voor élke tenant tegelijk. Een tweede tenant kan vandaag geen eigen prompts of eigen labels hebben zonder de andere tenant te raken.
- Spec-regel: §2.1 "Per tenant configureerbaar"
- Werkelijkheid: `app_config` heeft `(key, value, category)` zonder `tenant_id`-kolom (DATABASE.md + 02-architectuur §5)
- Remediatie-klasse: **schema-uitbreiding** (`app_config.tenant_id` + RLS) of **herontwerp** (richting `content_packs`-model uit spec §6)
- Severity: **H** — schendt drie-lagen-scheiding, blokkeert white-label belofte (§1) en methode-agnostisch principe (§2.2)

**Gap (S-2):** Geen tenant-admin UI voor content-laag. Alleen één globale Admin (route `/admin`, single email-RLS) die `app_config` voor alle tenants tegelijk wijzigt.
- Spec-regel: §2.1 (impliciet, "configureerbaar per tenant" zonder eigen beheer-UI is niet zinvol)
- Werkelijkheid: 01-functioneel §14 — Admin heeft 4 tabs (`AI Prompts`/`Labels`/`Instellingen`/`Blok Titels`), allemaal global
- Remediatie-klasse: **herontwerp** (volgt op S-1; pas zinvol als content-laag tenant-scoped is)
- Severity: **H** — koppelt aan S-1; geen aparte severity nodig

---

### §2.2 — Configuratie boven code

**Spec:** "Alles wat per tenant, per framework of per deployment verschilt, moet via configuratie werken — niet via code." Vijf concrete sub-eisen:

| # | Sub-eis | Werkelijkheid | Bewijs |
|---|---|---|---|
| a | Labels via DB, niet in JSX | ⚠️ **partieel** — 220 ESLint-violations open (label-completeness sweep niet gedaan) | tech_debt.md P4; 01-functioneel §11/§18 noemt LoginScreen + ProjectInfoSidebar volledig hardcoded |
| b | Framework-structuur als data | ❌ **hardcoded** — `BLOCKS`-array in `BlockCard.jsx`, `SEGMENTS`-constant in RichtlijnenWerkblad, `WERKBLAD_REGISTRY` in DeepDiveOverlay | 01-functioneel §1 + §3 |
| c | AI-prompts in DB met template-syntax | ✅ **grotendeels** — 19 in `app_config`, 3 prompts hebben geen DB-override | 04-prompts §A + §B; 05-tech-debt §13 item #23 |
| d | Kleuren via CSS-variabelen | ✅ — 10 CSS-vars uit `theme_config`, geen hardcoded hex in feature-componenten | 02-architectuur §6 |
| e | Feature-toggles via DB-entitlements, niet env-vars | ❌ — `REACT_APP_ADMIN_EMAIL` env-var bepaalt admin-zichtbaarheid; geen entitlement-systeem | 01-functioneel §11/§14 |

**Gap (S-3):** Hardcoded UI-strings — 220 ESLint-warnings open. Vier hele bestanden geen `appLabel`-call: `LoginScreen.js`, `ProjectInfoSidebar.jsx`, `ErrorBoundary.jsx` (deels), `StrategyOnePager.jsx` (deels).
- Spec-regel: §2.2.a + §15.1 "Labels en terminologie uit i18n-keys, nooit hardcoded strings"
- Werkelijkheid: 05-tech-debt §10
- Remediatie-klasse: **config-shift** (sweep + LABEL_FALLBACKS + migratie)
- Severity: **M** — bekend en gepland (tech_debt P4 sweep); hindert taal-switch en theming-completeness, niet brekend

**Gap (S-4):** Framework-structuur is hardcoded. De 7 BTC-blokken (`BLOCKS`-array), de 4 Richtlijnen-segmenten, de `WERKBLAD_REGISTRY`, en de canvas-layout (rij 1: strategie, rij 2: principles, rij 3: 4 pijlers, rij 4: portfolio) staan in JSX-componenten. Een tweede framework (SWOT-only, Porter, Wardley Map, Lean Canvas) zou een nieuwe code-deploy vereisen, geen DB-update.
- Spec-regel: §2.2.b + §6.1 framework-definitie als data
- Werkelijkheid: 01-functioneel §1 + 02-architectuur impliciet (geen `frameworks`-tabel)
- Remediatie-klasse: **herontwerp** (raakt `content_packs`-model uit §6 + bijna alle features)
- Severity: **H** — blokkeert "methode-agnostisch" (§1 strategisch principe)

**Gap (S-5):** 3 prompts hebben geen DB-override — `linkThemes` (`api/guidelines.js`), `SYSTEM_GENERAL_KNOWLEDGE` (`api/magic.js`), `generateSamenvatting` (`api/strategy.js`). Niet aanpasbaar zonder code-deploy.
- Spec-regel: §2.2.c + §6.2 ("Geen inline prompts in React-componenten" — strikt geldt dit voor server-prompts ook)
- Werkelijkheid: 05-tech-debt §13 item #23 + 01-functioneel A.4-A.6
- Remediatie-klasse: **config-shift** (3 keys toevoegen aan `app_config` + lookup in API)
- Severity: **M** — bekend gat; geen blocker maar inconsistent met de andere 19 prompts

**Gap (S-6):** Hardcoded EXAMPLE_BULLETS in `BlockCard.jsx` met klant-/branche-content (HNW, LifePro, DIFC, WOL). Zit in code, niet in DB.
- Spec-regel: §2.2 (configuratie boven code) + §2.4 (geen firma-aannames — zie aparte gap S-9)
- Werkelijkheid: 03-namen-en-termen §7 + 05-tech-debt §6.4
- Remediatie-klasse: **config-shift** (verplaatsen naar `app_config` of content-pack) **of** verwijderen
- Severity: **M** — voorbeeld-content is product-feature ("Voorbeeld laden"); niet trivieel weg

**Gap (S-7):** Geen entitlement-systeem; admin-toegang via `REACT_APP_ADMIN_EMAIL`-env-var.
- Spec-regel: §2.2.e + §8 (billing/entitlements via DB)
- Werkelijkheid: 01-functioneel §14 + 02-architectuur §8
- Remediatie-klasse: **schema-uitbreiding** + **herontwerp** (RLS-helper bestaat al voor `current_user_role()`, maar admin-policy gebruikt `auth.email()`)
- Severity: **M** — werkt nu met één persoon; blokkeert schaal naar tenant-admins

---

### §2.3 — Multi-tenancy vanaf dag één

**Spec:** "Zelfs met één gebruiker: alle data geïsoleerd per tenant. Geen shortcuts. RLS in Supabase is de primaire bescherming. Elke query impliciet gefilterd op tenant_id. Geen uitzonderingen — ook niet voor admin-panels."

**Werkelijkheid:** RLS-isolatie via `current_tenant_id()`-helper geïmplementeerd op data-tabellen (canvases, strategy_core, guidelines, etc.) per migraties 20260424*. **Maar**:

**Gap (S-8):** Admin-policy gebruikt hardcoded e-mailadres in plaats van rol-check.
- Spec-regel: §2.3 ("geen uitzonderingen — ook niet voor admin-panels") + §15.2 ("Tenant-ID hardcoden in queries of tests" — analoog: e-mail hardcoden in policies is dezelfde anti-patroon)
- Werkelijkheid: `supabase/migrations/20260420150000_fix_admin_email.sql:10-11` — `auth.email() = 'smaling.kingfisher@icloud.com'`. Helper-functie `current_user_role()` bestaat wél maar wordt niet gebruikt door admin-policy. (03-namen-en-termen §1 #42; 05-tech-debt §13 item #25)
- Remediatie-klasse: **config-shift** (migratie naar `current_user_role() = 'platform_admin'`)
- Severity: **H** — schendt §2.3-letterlijk én §15.2; ook governance-gap (zie 04-governance-gap)

**Gap (S-9):** `app_config` heeft geen tenant-scoping (zie ook S-1). Admin-tab "AI Prompts" wijzigt prompts voor élke tenant tegelijk.
- Spec-regel: §2.3 ("Elke query impliciet gefilterd op tenant_id")
- Werkelijkheid: 03-namen-en-termen §13 — `app_config` zit niet onder RLS-tenant-filter; alleen `SELECT TO authenticated USING (true)` (02-architectuur §5)
- Remediatie-klasse: zie S-1 (samen)
- Severity: **H** — duplicaat van S-1, zelfde root-cause

**Gap (S-10):** Auto-aanmaak `user_profiles` ontbreekt. Bij signup verschijnt user in `auth.users` zonder tenant-koppeling — RLS blokkeert dan alle queries (correct gedrag), maar UX is "Account wacht op activatie"-scherm zonder ingeleverde flow.
- Spec-regel: §2.3 (impliciet — multi-tenancy moet werken vanaf signup)
- Werkelijkheid: Issue #70 open; 01-functioneel §11
- Remediatie-klasse: **schema-uitbreiding** (DB trigger op `auth.users` insert) of **herontwerp** (signup-flow met tenant-keuze)
- Severity: **M** — workaround bestaat (handmatig in Supabase Dashboard); blokkeert self-service

---

### §2.4 — Geen firma-specifieke aannames in de code

**Spec (letterlijk regel 67-69):** "De naam van de initiële launch customer mag nergens in de codebase voorkomen — niet in variabelen, niet in seed-scripts, niet in commentaar, niet in tests. Hetzelfde voor branche-specifieke termen (verzekering, financial services) buiten dedicated branche-templates. Code is generiek, eerste tenant is slechts één instantie."

**Werkelijkheid:** **deze regel wordt actief geschonden.** Volledige inventarisatie in 03-namen-en-termen.

**Gap (S-11):** "Kingfisher / Kingfisher & Partners" — 54 hardcoded voorkomens.
- Categorisatie (uit 03-namen-en-termen §1):
  - 4 productie-prompts (`prompt.improve` fallback, `prompt.magic.system_heavy`, `prompt.magic.system_standard`, `prompt.validate`) — hardcoded in `api/*.js` én in DB
  - JSX-strings: `LoginScreen.js` (3×), `StrategyOnePager.jsx` (2×), `GuidelinesOnePager.jsx`, `ErrorBoundary.jsx`, `App.js` footer-fallback, `AppConfigContext.jsx` LABEL_FALLBACKS, `useTheme.js` JS-default
  - 7 file-headers (comment `Kingfisher & Partners — April 2026`)
  - 1 BroadcastChannel-naam `kingfisher_btc` (technische identifier)
  - Test-bestand (`tests/example.spec.js`) met privé-mail Kees + URL-locator
  - Deploy-script + Vercel-project-naam (`kingfisher-btc-tool`) + GitHub-repo-naam
  - 7 migraties met seed-text of comments
  - 6 dood-code-prompts in `src/prompts/btcPrompts.js`
- Spec-regel: §2.4 letterlijk
- Remediatie-klasse: **config-shift** (de-Kingfisher-isering: prompts/labels naar tenant-scoped — afhankelijk van S-1) + **herontwerp** (Vercel-projectnaam + repo-naam) + opruimen dood code
- Severity: **H** — schendt direct §2.4 én §15.2 én strategisch principe "Platform, geen project" (§1)

**Gap (S-12):** Branche-specifieke termen — verzekering, financial services, HNW, wealth, LifePro, DIFC, WOL, APE.
- Locaties (uit 03-namen-en-termen §7):
  - `BlockCard.jsx EXAMPLE_BULLETS` — 7 entries met insurance/HNW-jargon, geactiveerd via "Voorbeeld laden"
  - `api/magic.js SYSTEM_HEAVY` (regel 37) + identieke live `prompt.magic.system_heavy` — letterlijk "financiële en verzekeringssector"
  - `src/prompts/btcPrompts.js` (dood) — Segment HNW, broker channel, etc.
  - Prototype-bestand `docs/prototypes/inzichten-prototype-v2.html` — mock-data
- Spec-regel: §2.4 letterlijk ("branche-specifieke termen ... buiten dedicated branche-templates")
- Remediatie-klasse: **config-shift** (EXAMPLE_BULLETS naar content-pack of generieke voorbeelden) + **herschrijven prompt** (system_heavy generieker formuleren) + opruimen dood code
- Severity: **H** — schendt §2.4 letterlijk; voorkomen in productie-prompt is acuut IP/positionering-risico

**Gap (S-13):** Auteurs-attributie BTC-boek (Beijen/Heetebrij/Tigchelaar) hardcoded in TipsModal en i18n.
- Locaties (03-namen-en-termen §3): `i18n.js` NL+EN footer, `TipsModal.jsx` NL+EN intro, `btcPrompts.js` (dood)
- Spec-regel: §2.4 (firma-aannames — auteurs zijn geen firma maar wel bron-attributie van dood-IP), §6.3 ("De initiële framework-implementaties moeten geen terminologie bevatten waar mogelijk derde-partij rechten op rusten")
- Remediatie-klasse: **beslissing nodig** (attributie behouden = methode-erkenning; weghalen = methode-onafhankelijkheid). Zie 02-ip-gap.
- Severity: **M-H** afhankelijk van IP-keuze

**Gap (S-14):** Klant-cases TLB/MAG/ACE/Spain/Santander/GTS in dood code (`src/prompts/btcPrompts.js`) en in test-asset bestandsnaam (`Work in progress BTP MAG Final Version-1.pptx`).
- Spec-regel: §2.4 (geen klant-namen)
- Werkelijkheid: 03-namen-en-termen §6; 05-tech-debt §6.5; sectie A.2 #13 in fase 1 index
- Remediatie-klasse: opruimen dood code (`git rm src/prompts/btcPrompts.js`) + verwijderen test-asset
- Severity: **M** — dood code is niet productie, maar zit in publieke git-history; klant-naam in bestandsnaam vereist mogelijk klant-notificatie (zie IP-gap)

---

## §3 Tech stack

**Spec (tabel §3):** definitief voor fase 1+2; wijziging alleen bij fundamenteel technisch probleem.

**Werkelijkheid vs. spec — per laag:**

| Laag | Spec | Werkelijkheid | Klasse | Severity |
|---|---|---|---|---|
| Frontend framework | React 18+ met TypeScript | React 19 met **JS** (geen TS) | **docs-update of beslissing** | M |
| Build tooling | **Vite** | **CRA (`react-scripts 5.0.1`)** | **docs-update of herontwerp** | M |
| Styling | Tailwind + CSS-vars | ✅ Tailwind 3.4 + CSS-vars | — | — |
| UI componenten | **shadcn/ui (Radix)** | **geen shadcn** — eigen `lucide-react`-iconen + Tailwind-classes | **docs-update of herontwerp** | L |
| Charts | Recharts / ECharts | **niet gevonden** in dependencies (geen chart-library actief) | docs-update | L |
| State management | Context + TanStack Query | Context only — **geen TanStack Query** | docs-update of beslissing | L |
| BaaS | Supabase | ✅ | — | — |
| Serverless | **Supabase Edge Functions (Deno)** | **Vercel Serverless Functions (Node)** | **docs-update of herontwerp** | M |
| Auth | Supabase Auth | ✅ | — | — |
| AI provider | Anthropic Claude | ✅ + OpenAI voor embeddings | — | — |
| AI fallback | OpenAI | gebruikt voor embeddings, niet als LLM-fallback | docs-update | L |
| Presentation export | **Gamma API** | **niet aanwezig** | docs-update of feature-gap (zie 03-functioneel) | L |
| PDF export | **@react-pdf/renderer of reportlab** | **`window.print()` via browser** | docs-update of herontwerp | M |
| Betalingen | **Stripe** | **niet aanwezig** (geen billing) | functioneel-gap (zie 03-functioneel) | M |
| Hosting | Vercel | ✅ | — | — |
| Monitoring | **Sentry + PostHog** | **niets** (alleen 5× `console.log`, zie 05-tech-debt §3) | docs-update of herontwerp | M |

**Gap (S-15):** Tech stack-keuzes wijken systematisch af. CRA i.p.v. Vite, JS i.p.v. TypeScript, Vercel Functions i.p.v. Supabase Edge Functions, geen shadcn, geen Sentry, geen PostHog, geen Stripe, geen Gamma. Niet één aansluitende deelverzameling — fundamentele platform-keuzes verschillen.

- Twee scenario's:
  - **A — spec is achterhaald:** keuzes zijn bewust gemaakt op grond van operationele eenvoud (§1.3) en CRA was al geïnstalleerd. Spec moet bijgesteld.
  - **B — werkelijkheid moet migreren:** spec verwoordt het gewenste eindbeeld; CRA→Vite, JS→TS, Vercel→Edge Functions zijn open migraties.
- Remediatie-klasse: **beslissing nodig** (welk scenario), daarna **docs-update** (A) of **herontwerp** (B)
- Severity: **M** — geen brand, wel principieel; raakt onderhoudbaarheid en TypeScript-type-veiligheid bij multi-tenant uitbreiding

**Niet als gap:** dat de tech stack fase 1 nog niet alles uit spec heeft is op zich verdedigbaar (zie §1 ambitietijdlijn — "Werkende tool, interne validatie"). Wel moet de spec dit erkennen of de werkelijkheid een migratie-plan krijgen.

---

## §4 Multi-tenant datamodel

**Spec:** 8 kerntabellen met specifieke ontologie: `tenants`, `users`, `content_packs`, `analyses`, `simulations`, `subscriptions`, `credits_ledger`, `exports`, `audit_log`. Drie tenant-types vanaf dag één.

**Werkelijkheid (uit DATABASE.md + multi-tenancy-migraties + 02-architectuur §3):**

| Spec-tabel | Werkelijkheid | Notitie |
|---|---|---|
| `tenants` | ✅ aanwezig | mist `parent_tenant_id`, `content_pack_id`, `subscription_id` |
| `users` (met role+tenant_id) | ⚠️ als `user_profiles` (FK naar `auth.users`) | naam-mismatch + Supabase Auth provides `auth.users`; spec lijkt eigen `users`-tabel te willen — werkelijkheid is hybride |
| `content_packs` | ❌ ontbreekt | content zit in `app_config` (global) + `block_definitions` (global) |
| `analyses` | ⚠️ deels via `strategy_core`, `guidelines`, `guideline_analysis`, `strategy_core.insights` | spec heeft één gegeneraliseerde tabel; werkelijkheid heeft per-werkblad-tabellen met andere ontologie |
| `simulations` | ❌ ontbreekt | geen simulation-engine in code |
| `subscriptions` | ❌ ontbreekt | geen billing |
| `credits_ledger` | ❌ ontbreekt | geen metering |
| `exports` | ❌ ontbreekt | OnePager via `window.print()` — geen persistent export-record |
| `audit_log` | ❌ ontbreekt | geen tabel; ook geen audit op `app_config`-mutaties (zie 02-ip-gap & 04-governance-gap) |

**Tenant-types:**
- Spec: `consultancy` / `enterprise` / `individual`
- Werkelijkheid: alleen `consultancy` (`tenants.tenant_type = 'consultancy'` voor beide tenants — 03-namen-en-termen §13)

**Extra tabellen die spec niet noemt:** `canvases`, `strategy_core`, `analysis_items`, `strategic_themes`, `ksf_kpi`, `guidelines`, `guideline_analysis`, `canvas_uploads`, `document_chunks`, `import_jobs`, `app_config`, `block_definitions`, `tenants`, `user_profiles`, RLS-helpers `current_tenant_id()` / `current_user_role()`. (DATABASE.md + 02-architectuur §3)

**Gap (S-16):** Datamodel-ontologie wijkt fundamenteel af. Spec heeft een gegeneraliseerd `analyses` + `content_packs`-model; werkelijkheid heeft per-werkblad gespecialiseerde tabellen (`strategy_core`, `guidelines`). Spec verwacht `simulations`, `subscriptions`, `credits_ledger`, `exports`, `audit_log` — alle vier ontbreken.

- Spec-regel: §4.2 (kerntabellen)
- Remediatie-klasse: **beslissing nodig** (spec aanpassen of grote migratie?). Variant 1: spec achterhalen → "we hebben gekozen voor BTC-specifiek schema in fase 1, generaliseren in fase 2/3". Variant 2: schema-migratie naar gegeneraliseerd model. **Niet beide tegelijk haalbaar in fase 1.**
- Severity: **H** — blokkeert white-label (geen content_packs), billing (geen subscriptions/credits), en commerciële roadmap (geen exports persistent, geen audit_log)

**Gap (S-17):** Geen `audit_log`-tabel. Direct relevant voor:
- §10 (audit-logging als beveiligingsverplichting)
- 02-ip-gap (live `prompt.strategy.analysis` afwijkt van migratie zonder spoor — zie A.3 fase 1)
- 04-governance-gap (klant moet kunnen verifiëren wie wat zag)
- Spec-regel: §4.2 + §10 ("Elke niet-triviale actie in audit_log. Behoud 7 jaar voor enterprise.")
- Remediatie-klasse: **schema-uitbreiding**
- Severity: **H** voor enterprise-context, **M** voor huidige fase 1

**Gap (S-18):** Geen `subscriptions` + `credits_ledger`. Geen billing-architectuur überhaupt.
- Spec-regel: §4.2 + §8 (billing en entitlements)
- Remediatie-klasse: **herontwerp** (raakt Stripe-integratie + tier-logica + entitlement-checks per actie)
- Severity: **M** — geen billing acceptabel in fase 1 (interne tool), blocker voor fase 2

**Gap (S-19):** `users`-tabel-schema inconsistentie. Spec heeft `users (id, tenant_id, email, role, preferences)`. Werkelijkheid: `user_profiles (id FK auth.users, tenant_id, role)` — geen `email` (komt uit `auth.users`), geen `preferences`. Hybride met Supabase Auth.
- Spec-regel: §4.2
- Remediatie-klasse: **docs-update** (spec aansluiten op Supabase-Auth-pattern; geen eigen email-kolom nodig)
- Severity: **L** — werkelijkheid is functioneel correct, spec beschrijft pre-Supabase-Auth-design

**Gap (S-20):** Tenant-types — alleen `consultancy` actief. `enterprise` en `individual` niet getest.
- Spec-regel: §4.1
- Werkelijkheid: kolom `tenant_type` bestaat (live `consultancy` voor beide); geen tier-onderscheid in code-paden
- Remediatie-klasse: **docs-update** ("nog niet geactiveerd") of **herontwerp** (per type een ander code-pad)
- Severity: **L** — geen blocker

---

## §5 Design tokens en theming

**Spec (§5.1):** uitgebreid token-schema met `brand` (11 keys), `typography` (5 keys), `layout` (4 keys), `logo` (4 keys), `export` (3 keys).

**Werkelijkheid:** `tenants.theme_config` heeft 10 keys — alleen brand-kleuren (7), 2 logo-URLs, 1 brand_name. `product_name` als 11e key (live in DB, niet in spec). (02-architectuur §6 + 03-namen-en-termen §13)

| Spec-categorie | Spec keys | Werkelijkheid | Klasse | Severity |
|---|---|---|---|---|
| `brand.*` | 11 keys (primary, primary_foreground, secondary, accent, background, foreground, muted, border, destructive, success, warning) | 7 keys (primary, accent, accent_hover, success, analysis, overlay, accent_light) | docs-update + schema-uitbreiding | L |
| `typography.*` | 5 keys (heading_font, body_font, mono_font, base_size, scale) | **0** — Inter hardcoded in `src/index.css` body | schema-uitbreiding | L |
| `layout.*` | 4 keys (radius, density, shadow_style, container_max_width) | **0** — geen layout-tokens | schema-uitbreiding | L |
| `logo.*` | 4 keys (light_url, dark_url, favicon_url, wordmark_url) | 2 keys (logo_url, logo_white_url); favicon hardcoded in `public/`; geen wordmark | schema-uitbreiding | L |
| `export.*` | 3 keys (gamma_theme_id, pdf_template_id, email_from_name) | **0** — geen export-tokens (geen Gamma) | schema-uitbreiding (volgt op exports) | L |

**Gap (S-21):** Token-schema is veel beperkter dan spec. Past bij L1-tier (§5.2) — Brand basics. L2 (Pro) en L3 (Business) zijn nog niet ondersteund.
- Spec-regel: §5.1 + §5.2 (drie thema-fasering)
- Remediatie-klasse: **schema-uitbreiding** + UI-injectie van extra CSS-vars
- Severity: **L** — fase 1 acceptabel; relevant voor Pro+ tier

---

## §6 Content pack architectuur

**Spec:** content packs zijn de configureerbare methode-laag. Frameworks-definities (§6.1) als JSON; prompt-templates met `id, name, system, user_template, model, temperature, max_tokens, tenant_overridable, version` (§6.2); content packs zijn eigendom van hun maker (§6.3).

**Werkelijkheid:**
- Geen `content_packs`-tabel
- Geen `frameworks`-data — `BLOCKS`-array hardcoded (zie S-4)
- Prompts zitten in `app_config(key, value, category, description)` — **geen** `model`, `temperature`, `max_tokens`, `version`, `tenant_overridable` velden. `max_tokens` is hardcoded per endpoint in `api/*.js` (parking-lot-item P3 "Token-budget per analyse-type configureerbaar maken")
- Geen versie-historie op prompts (05-tech-debt §13 item #11-#12 — Novius-claim toegevoegd zonder spoor)

**Gap (S-22):** Geen content-pack-architectuur. Frameworks, prompts en exports zijn niet als pakket-eenheid bestuurbaar; geen eigendom-koppeling per pack.
- Spec-regel: §6 integraal
- Remediatie-klasse: **herontwerp** (raakt §2.1 + §4 + §2.4)
- Severity: **H** — blokkeert "white-label", "methode-agnostisch", "klant vertrekt → pack gaat mee" (§6.3)

**Gap (S-23):** Prompt-template-schema mist 5 velden uit spec (model, temperature, max_tokens, version, tenant_overridable). Geen versie-historie of rollback mogelijk.
- Spec-regel: §6.2
- Werkelijkheid: 02-architectuur §5 + 04-prompts (alle 19 prompts zonder metadata)
- Remediatie-klasse: **schema-uitbreiding** (kolommen toevoegen aan `app_config` of nieuwe `prompts`-tabel) of **herontwerp** (volgt op S-22)
- Severity: **M** — versioning-gat is acuut gegeven Novius-incident; tenant_overridable koppelt aan S-1

**Gap (S-24, sub-gap van S-22):** Spec-regel §6.3 ("De initiële framework-implementaties moeten geen terminologie bevatten waar mogelijk derde-partij rechten op rusten") wordt geschonden door BTC-naam, BTC-blokken-naamgeving, methode-claims in prompts. Cross-link naar 02-ip-gap.

---

## §7 AI orchestratie

**Spec:**
- §7.1 — provider-agnostische abstraction layer (`AIProvider`-interface, `AnthropicAdapter`, `OpenAIAdapter`, `AIOrchestrator`)
- §7.2 — server-side, niet client-side
- §7.3 — streaming voor lange analyses
- §7.4 — graceful degradation, geen silent failures

**Werkelijkheid (02-architectuur §4):**

| Sub-eis | Werkelijkheid | Klasse | Severity |
|---|---|---|---|
| §7.1 abstraction | ❌ — direct `fetch("https://api.anthropic.com/...")` per `api/*.js`-endpoint | herontwerp | M |
| §7.2 server-side | ✅ — alle AI-calls in Vercel Serverless (`api/*.js`), niet client-side | — | — |
| §7.3 streaming | ❌ — geen SSE; lange analyses blokkeren UI met spinner | herontwerp | L |
| §7.4 graceful degradation | ⚠️ — wel error-handling op API-laag, niet op call-site (zie CLAUDE.md 4.2 non-compliance, 10 callbacks) | bekend (tech_debt P2) | M |

**Gap (S-25):** Geen abstraction layer. Provider-switch (Claude → OpenAI) zou alle 8 endpoints raken. Geen cost-tracking, geen retry-logica, geen prompt-versioning op één plek.
- Spec-regel: §7.1
- Remediatie-klasse: **herontwerp**
- Severity: **M** — gaat samen met S-22 (content-pack model) en S-23 (prompt-metadata)

**Gap (S-26):** Geen streaming. UI toont alleen "Analyse draaien…"-loading state; bij analyse-runs van 5-20 sec geen progressieve output.
- Spec-regel: §7.3 ("Geen loading spinner langer dan 2 seconden zonder progressieve output")
- Werkelijkheid: 01-functioneel §2.4 + InzichtenOverlay loading-states
- Remediatie-klasse: **herontwerp** (SSE of Supabase Realtime)
- Severity: **L** — UX-verbetering, niet brekend

**Gap (S-27):** Twee Sonnet-aliases tegelijk in productie (`claude-sonnet-4-5` en `claude-sonnet-4-20250514`); `api/validate.js` comment zegt Haiku, code gebruikt Sonnet. Bezwaarlijk omdat een abstraction layer dit zou normaliseren.
- Spec-regel: §7.1 (impliciet — model-keuze als config)
- Werkelijkheid: 02-architectuur §4 + 05-tech-debt §9.1, §9.2
- Remediatie-klasse: **config-shift** (model als kolom op `app_config` per prompt) of **docs-update** (model is een spec-keuze, niet runtime)
- Severity: **L** — geen functioneel risico

---

## §8 Billing en entitlements

**Spec:** credit-systeem (§8.1), 4-tier-structuur (§8.2), Stripe-integratie (§8.3).

**Werkelijkheid:** **niets aanwezig.** Geen Stripe, geen credits-tabel, geen tier-logica, geen entitlement-checks.

**Gap (S-28):** Volledige billing-laag ontbreekt.
- Spec-regel: §8 integraal
- Remediatie-klasse: **herontwerp** (Stripe-integratie + DB-schema + entitlement-middleware)
- Severity: **L** voor fase 1 (interne tool), **H** voor fase 2 (3-5 betalende design partners)

**Niet als acute gap geclassificeerd** — fase 1 is impliciet "geen billing nodig". Wel **vlag in 00-index als spec-update nodig**: spec moet of een fase-1-uitzondering benoemen, of het ambitietijdlijn-pad (§1.4) moet expliciet zeggen "billing pas in fase 2".

---

## §9 Export pipeline

**Spec:** PDF (in-app, server-side via reportlab of @react-pdf/renderer), Gamma deck (API-generated, board-kwaliteit), PPTX (template-based).

**Werkelijkheid:** alleen browser-`window.print()` op `<StrategyOnePager>` en `<GuidelinesOnePager>`. Geen server-side render, geen Gamma, geen PPTX-export, geen `exports`-tabel.

**Gap (S-29):** Export-pipeline ontbreekt op spec-niveau. Huidige rapportage = browser-print → PDF.
- Spec-regel: §9 integraal
- Werkelijkheid: 01-functioneel §2.6 + §3 + §10
- Remediatie-klasse: **herontwerp** (Edge Function of @react-pdf/renderer + tenant-theming)
- Severity: **M** — Output B (Rapportage) staat in tech_debt (#56) als open; commercieel waardepropositie hangt mede van export-kwaliteit (§9 spec-regel "Kwaliteit bepaalt productperceptie")

---

## §10 Beveiliging en compliance

**Spec (10 sub-eisen):**

| Sub-eis | Werkelijkheid | Klasse | Severity |
|---|---|---|---|
| Data-isolatie via RLS + unit tests | ⚠️ RLS aanwezig op data-tabellen; **geen** unit tests die cross-tenant verifiëren; admin-policy op email i.p.v. rol (S-8) | schema-uitbreiding (tests) + config-shift | M |
| Authenticatie: Supabase Auth, OAuth Pro, SAML/SSO Enterprise, MFA | ✅ Supabase Auth email+wachtwoord; ❌ geen OAuth/SSO/MFA | herontwerp | M (fase 2) |
| Data at rest versleuteld | ✅ Supabase default | — | — |
| Data in transit TLS 1.3 + HSTS | ✅ Vercel default | — | — |
| Secrets in Edge Function env-vars + rotatie | ⚠️ env-vars in Vercel (niet Edge Functions); geen rotatie-procedure | docs-update | L |
| **Audit logging** | ❌ ontbreekt — zie S-17 | schema-uitbreiding | H |
| GDPR/AVG: DPA + export/delete | ❌ geen DPA-template; geen export/delete UI | herontwerp | M (fase 2) |
| Data retention 3 jaar default + auto-delete | ❌ geen retention-policy in code/DB | schema-uitbreiding | M (fase 2) |
| Backup + maandelijkse restore-verificatie | ⚠️ Supabase PITR aanwezig (default); **geen** restore-verificatie-procedure | docs-update | L |
| Third-party deps: maandelijkse npm audit + Renovate | ❌ geen Renovate-config zichtbaar; geen npm-audit-procedure | docs-update | L |

**Gap (S-30):** Audit-logging ontbreekt. Direct gekoppeld aan S-17 + Novius-incident (live prompt afwijkt van migratie).
- Severity: **H** — schendt §10 letterlijk; gekoppeld aan governance-gap

**Gap (S-31):** Geen RLS-unit-tests. Spec eist "expliciete unit-tests (per role, per tenant-type)". Werkelijkheid: 0 tests over RLS; CRA-default `App.test.js` zou faillen (05-tech-debt §5.4); Playwright is uitgeschakeld.
- Spec-regel: §10 ("Unit tests die cross-tenant toegang verifiëren")
- Werkelijkheid: 02-architectuur §9 (Tests-sectie)
- Remediatie-klasse: **schema-uitbreiding** (test-suite optuigen) + **herontwerp** (CI-pipeline activeren)
- Severity: **M** — geen acuut risico (RLS werkt), wel governance/accreditatie-gat

**Gap (S-32):** Geen DPA-template, geen export/delete-UI, geen retention-policy.
- Cross-link: 04-governance-gap (volledige uitwerking daar)
- Severity: **M** voor fase 2 (tweede klant)

---

## §11 Development workflow

**Spec:**
- §11.1 — monorepo-structuur (`/apps/web`, `/apps/admin`, `/packages/{ui,core,types,ai-client}`, `/supabase/{migrations,functions,seed}`)
- §11.2 — main altijd deployable, PRs verplicht (ook solo), Conventional Commits, semver-tags, private repo onder holding-account
- §11.3 — Vitest unit tests / integration tests / RLS policy tests / Playwright E2E
- §11.4 — local / staging / production
- §11.5 — Claude Code actief gebruikt, elke commit menselijk gereviewd

**Werkelijkheid:**

| Sub-eis | Werkelijkheid | Klasse | Severity |
|---|---|---|---|
| Monorepo (apps + packages) | ❌ — flat repo: `src/`, `api/`, `supabase/migrations/`, geen packages | herontwerp | L |
| Aparte admin-build | ❌ — admin is route `/admin` in zelfde app | docs-update | L |
| PRs verplicht | ❌ — geen PR-template, single contributor pusht direct naar master (02-architectuur §8 + 05-tech-debt §13) | docs-update | L |
| Conventional Commits | ✅ partieel — recent commits volgen format ("feat:", "audit():", "chore:") | — | — |
| Semver-tags | ❌ — geen tags zichtbaar | docs-update | L |
| Private repo onder holding-account | ⚠️ — `KFSmaling/kingfisher-btc-tool` op GitHub (persoonlijke account, niet holding-org) | beslissing nodig | M |
| Vitest + integration + RLS-tests + Playwright | ❌ — alleen CRA-default Jest (failing), Playwright uitgeschakeld (`.disabled`) | herontwerp | M |
| local/staging/production | ⚠️ — alleen local + production; staging afwezig (P5 tech_debt — demo-omgeving open) | herontwerp | M |

**Gap (S-33):** Repo-structuur is geen monorepo. Voor één-app fase 1 acceptabel; multi-tenant + admin-aparte-build vraagt herontwerp later.
- Severity: **L**

**Gap (S-34):** Geen test-suite (afgezien van CRA-default die faalt). RLS-tests ontbreken (zie S-31).
- Severity: **M**

**Gap (S-35):** Repo onder persoonlijke GitHub-account (`KFSmaling`), niet holding-org. Spec §11.2 zegt "Private repository onder eigen/holding-account, niet firma" — letterlijk nu compliant, maar "holding-account" is niet hetzelfde als persoonlijk account.
- Spec-regel: §11.2
- Remediatie-klasse: **beslissing nodig** (transfer naar holding-org)
- Severity: **M** — IP-eigenaarschap vraagt holding-account, niet persoonlijk

**Gap (S-36):** Geen staging-omgeving sinds 2026-04-22. Demo-architectuur fase 2-4 open (tech_debt P5).
- Spec-regel: §11.4
- Severity: **M** — blocker voor externe testers

---

## §12 Anti-patronen

**Spec (lijst van verboden):**

| Anti-patroon | Werkelijkheid | Bewijs |
|---|---|---|
| Hardcoded tenant-data | **AANWEZIG** — 54× Kingfisher (S-11) | 03-namen-en-termen §1 |
| God-components (>300 regels) | **AANWEZIG** — `StrategieWerkblad.jsx` 1437 regels, `RichtlijnenWerkblad.jsx` 901 regels, `StrategyOnePager.jsx` 583 regels, `AdminPage.jsx` 492 regels | 01-functioneel §2 + §3 + §2.6 + §14 |
| Props drilling > 3 levels | niet uitputtend gemeten | — |
| Magic numbers | niet uitputtend gemeten | — |
| Silent catch blocks | **AANWEZIG** — 10 in tech_debt P2; `StrategieWerkblad.handleClose` `.catch(() => {})` | tech_debt.md P2 |
| Direct Supabase-queries in components | gemitigeerd via services-pattern (CLAUDE.md §3) | — |
| Tenant-data in localStorage | niet aangetroffen | — |

**Gap (S-37):** God-components — 4 bestanden boven 300 regels. Spec-anti-patroon §12.1 letterlijk.
- Spec-regel: §12.1 (uitzondering "data-tabel configuraties" — geldt hier niet)
- Remediatie-klasse: **herontwerp** (component-splitsing per werkblad)
- Severity: **L-M** — bekend pattern, niet brekend; opent bug-vlak (zie ook CLAUDE.md 4.2/4.4 non-compliance dat correlaat is met component-omvang)

**Gap (S-38):** Silent catch blocks — 10 specifieke locaties open in tech_debt P2.
- Spec-regel: §12.1
- Werkelijkheid: tech_debt.md P2 (ge-escaleerd)
- Remediatie-klasse: bekend (incrementeel per file-touch volgens tech_debt-strategie)
- Severity: bekend; niet hier opnieuw scoren

---

## §13 Besluitkader

Sectie 13 is een proces-richtlijn (6 vragen voor elke feature), niet een code-toetsbare verplichting. Geen aparte gap. **Wel constatering:** voor zover uit fase 1 + git-historie te zien valt, is dit besluitkader niet zichtbaar toegepast — de 4 stub-werkbladen, hardcoded EXAMPLE_BULLETS en KF-naam in prompts zouden bij vraag 1 ("Platform of content?") of vraag 5 ("IP-risico?") gestopt moeten zijn.

**Gap (S-39):** Besluitkader §13 wordt impliciet, niet expliciet gevolgd. Geen ADRs (§14.3) zichtbaar in `docs/`.
- Spec-regel: §13 + §14.3 ("Architectuur-beslissingen in Architecture Decision Records (ADR) in /docs")
- Werkelijkheid: 11 docs in `docs/` (planning + reviews), 0 ADRs in `docs/architecture`-pad
- Remediatie-klasse: **docs-update** (ADR-template + retroactieve ADRs voor majeure keuzes: CRA i.p.v. Vite, JS i.p.v. TS, Vercel i.p.v. Edge Functions, single `app_config` i.p.v. content_packs)
- Severity: **L** — proces-gap, geen functioneel risico

---

## §14 Operationele richtlijnen

**Spec:**
- §14.1 — errors naar Sentry met tenant_id-tag (geen PII in messages); product-analytics naar PostHog; business-metrics dashboard; wekelijks review
- §14.2 — incident-response (kritiek/hoog/medium-laag), status-page voor betalende klanten
- §14.3 — ADRs, doc-kwartaal-update, runbooks, API-doc

**Werkelijkheid:**

| Sub-eis | Werkelijkheid | Klasse | Severity |
|---|---|---|---|
| Sentry | ❌ — niet geconfigureerd; 5× `console.log` met user-data lekt naar runtime-logs (05-tech-debt §3) | herontwerp | M |
| PostHog | ❌ — niet geconfigureerd | herontwerp | L |
| Business-metrics dashboard | ❌ | herontwerp | L |
| Incident-procedure + status-page | ❌ — geen documented procedure, geen status-page | docs-update | L (fase 1) |
| ADRs | ❌ — zie S-39 | docs-update | L |
| API-documentatie | ❌ — geen TypeDoc / equivalent | docs-update | L |

**Gap (S-40):** Geen observability (Sentry/PostHog). Productie-incidenten alleen via Vercel-runtime-logs traceerbaar.
- Spec-regel: §14.1
- Werkelijkheid: 05-tech-debt §3 (`console.log` lekt user-data); 02-architectuur §4 (geen retry/cost-tracking)
- Remediatie-klasse: **herontwerp** (Sentry + PostHog + dashboard)
- Severity: **M** — blocker voor fase 2 (betalende design partners verwachten oncall + status-page)

**Gap (S-41):** 5× productie-`console.log` met user-data (canvas-content, autosave-data, embedding-stats). Schendt §10 ("geen PII in error messages") en §14.1 (impliciet).
- Spec-regel: §10 + §14.1
- Werkelijkheid: 05-tech-debt §3 (5 specifieke locaties)
- Remediatie-klasse: **config-shift** (logger-wrapper bestaat al in `src/shared/utils/logger.js`; locaties moeten `console.log` → `log()` migreren)
- Severity: **M** — privacy-relevant; kort op te lossen

---

## §15 Richtlijnen voor AI coding assistants

**Spec §15.1 (wat altijd) en §15.2 (wat nooit):** in essentie samenvattingen van eerdere secties. Direct meetbare schendingen:

| §15-regel | Werkelijkheid (schending?) | Cross-link |
|---|---|---|
| §15.1 "drie-lagen-scheiding aanhouden" | ❌ S-1 (content global) | S-1 |
| §15.1 "DB-operaties respecteren RLS + tenant-context" | ✅ op data-tabellen, ❌ op `app_config` | S-1, S-9 |
| §15.1 "UI-componenten via theme-tokens, nooit hardcoded kleuren" | ✅ in feature-componenten | — |
| §15.1 "Labels uit i18n-keys, nooit hardcoded strings" | ❌ 220 violations + S-3 | S-3 |
| §15.1 "AI-prompts via prompt-repository, niet inline" | ✅ partieel — 3 prompts hebben geen DB-override (S-5); productie gebruikt `appPrompt(...)` | S-5 |
| §15.1 "Elke nieuwe tabel krijgt RLS-policy" | ⚠️ wel op data-tabellen; `app_config` heeft `SELECT TO authenticated USING (true)` zonder tenant-filter | S-1 |
| §15.1 "Credits-verbruik via creditsLedger" | ❌ — geen credits-systeem (S-28) | S-28 |
| §15.2 "Tenant-ID hardcoden in queries of tests" | ❌ schending — admin-RLS hardcodet email; werkelijke UUIDs in seed-migratie + test-bestand | S-8, 02-ip-gap |
| §15.2 "Hardcoded strings in componenten" | ❌ schending — 220 violations | S-3 |
| §15.2 "Directe fetch() naar externe APIs vanuit components" | ✅ — alle AI-fetches via `apiFetch()` naar `api/*.js` | — |
| §15.2 "Silent exception handling" | ❌ schending — tech_debt P2 (S-38) | S-38 |
| §15.2 "Destructieve migraties zonder backup-stap" | niet aangetroffen in audit-pass | — |

Geen nieuwe gaps in §15 — alles cross-link naar eerder.

---

## §16 Slotwoord — drie hoofdregels

**Spec:** "Platformkwaliteit boven feature-kwantiteit / IP-bescherming boven snelheid / Architecturale integriteit boven kortetermijn-gemak."

Geen toetsbare gap; wel een richtsnoer voor severity-toekenning. **De 4 hoog-severity gaps (H) in dit document raken alle drie hoofdregels:**
- S-1, S-2, S-9, S-22 (content-global / geen content-packs) — schendt regel 3 (architectuur)
- S-4 (framework hardcoded) — schendt regel 1 + 3
- S-8 (admin-RLS op email) — schendt regel 2 + 3
- S-11, S-12 (KF-naam + branche-jargon) — schendt regel 1 + 2 + 3
- S-16 (datamodel-ontologie afwijkt) — schendt regel 3
- S-17, S-30 (geen audit-log) — schendt regel 2

---

## Spec-update-vlaggen

Bij vermoede tekortkoming in spec — niet zelf herschreven, hier gevlagd voor 00-index:

1. **Tech-stack-tabel §3** — wijkt fundamenteel af van werkelijkheid. Bewuste ontwikkel-keuze of out-of-date? **Beslissing nodig** voor §3.
2. **§4.2 datamodel** — `users`-tabel-schema gaat uit van eigen email-kolom; werkelijkheid gebruikt Supabase Auth `auth.users`. Spec moet worden aangevuld met Supabase-Auth-pattern.
3. **§8 billing** — geen fase-1-uitzondering benoemd. Spec moet expliciet zeggen "billing pas vanaf fase 2" of werkelijkheid moet inhalen.
4. **§9 export** — `pptxgenjs` (niet `reportlab`/`@react-pdf/renderer`) is wellicht beter passend gezien Vercel-Node-stack. Spec moet PDF-route herzien.
5. **§11.1 monorepo** — voor één-app fase 1 is monorepo overkill. Spec moet fase-1-uitzondering benoemen.

---

## Verificatie-paragraaf

### Wat ik heb gedaan voor compleetheid

- **Spec integraal gelezen** — alle 16 secties, regel-voor-regel met werkelijkheid vergeleken
- **Per spec-sectie expliciet gap-toets** — ook secties zonder gap (§16, §13, §15) geannoteerd
- **Cross-references** naar fase-1 documenten:
  - 01-functioneel.md § dashboard, werkbladen, OnePager, multi-tenancy, admin
  - 02-architectuur.md § 3 (DB), § 4 (AI), § 5 (config-laag), § 6 (theming), § 7 (multi-tenancy), § 8 (deploy), § 9 (tooling), § 10 (compliance)
  - 03-namen-en-termen.md § 1 (Kingfisher), § 7 (branche), § 13 (live DB-content)
  - 04-prompts.md § A.14, A.15, A.16, A.19 (prompts met KF-naam of methode-claim)
  - 05-tech-debt-aanvulling.md § 3, § 9, § 10, § 13 (audit-trail-gaten)
- **Tech_debt.md** — alle P1-P5-categorieën doorlopen om dubbeling met spec-gaps te voorkomen
- **Klasse + severity per gap** — beide expliciet gemotiveerd

### Niet onderzocht en waarom

- **Live database-state opnieuw geverifieerd** — niet zelf MCP-query gedraaid in fase 2; vertrouwd op fase-1 inventarisatie (2 dagen oud, geen majeure DB-wijziging gemeld)
- **Code-coverage van endpoints** — fase 1 had `api/strategy.js` integraal + andere via grep; geen extra reads in fase 2 nodig voor spec-gap (gap-density zit in datamodel + tenant-scoping, niet in endpoint-detail)
- **Werkelijke prestatie-meting** (load-tijden, AI-response-tijden) — buiten spec-gap-scope; spec heeft geen prestatie-eisen
- **Sentry/PostHog daadwerkelijk afwezig** — niet via grep `sentry`/`posthog` bevestigd; afgeleid uit fase-1 02-architectuur §9 (geen monitoring-tool genoemd) + package.json (geen sentry-deps)
- **Gamma API-integratie** — niet via grep bevestigd afwezig; fase-1 03-functioneel §10 noemt alleen `window.print()`

### Verificatie-steekproeven (3 willekeurige bevindingen herverifieerd)

1. **S-8 admin-RLS hardcodet email** — bestand `supabase/migrations/20260420150000_fix_admin_email.sql` bestaat in repo; fase 1 03-namen-en-termen #42 verwijst regel 10-11 letterlijk naar `auth.email() = 'smaling.kingfisher@icloud.com'`. Helper `current_user_role()` aangemaakt in migratie 20260424030000 maar niet door admin-policy gebruikt. ✅
2. **S-11 — 4 productie-prompts bevatten "Kingfisher & Partners"** — fase 1 04-prompts §A.14, §A.15, §A.19 noemt expliciet `prompt.magic.system_heavy`, `prompt.magic.system_standard`, `prompt.validate`. Vierde locatie: `api/improve.js:31` hardcoded fallback (03-namen-en-termen §1 #25); de geseede DB-versie is niet expliciet gechecked op KF-naam in fase 1 — mogelijke onnauwkeurigheid in mijn telling "4 prompts". Conservatief: minimaal 3 actieve productie-prompts (DB-versie geverifieerd via fase 1) + 1 hardcoded fallback. ✅ Voor severity-doel maakt het geen verschil (H blijft H).
3. **S-22 geen content-packs** — DATABASE.md heeft geen `content_packs`-tabel; live-DB query in fase 1 (03-namen-en-termen § verificatie) noemt 14 tabellen, geen content_packs ertussen. ✅

### Bekende blinde vlekken

- **Spec-interpretatie subjectief bij grijsgevallen.** Bv. "tenant-overridable" in §6.2 — werkelijkheid heeft geen `tenant_overridable`-kolom maar zou via toekomstige tenant-scope op `app_config` impliciet "true" worden. Geclassificeerd als "ontbreekt" (S-23), maar redelijk te betogen "afwezig op andere wijze opgelost".
- **Onderscheid "spec-update nodig" vs. "code achterloopt"** — bij gap S-15 (tech stack) en S-16 (datamodel) bewust dubbel geflagd: zou kunnen dat spec verouderd is, zou kunnen dat code moet inhalen. Beslissing voor Kees, niet voor mij.
- **Severity-schaal subjectief.** Eigen oordeel; H/M/L-cutoff is mijn interpretatie, niet exact gemeten. Motivatie per gap expliciet om herziening mogelijk te maken.
- **Spec §3-tabel** — niet uitputtend per dependency-versie geverifieerd (alleen aanwezigheid/afwezigheid van categorieën — TS/Vite/shadcn/Sentry/PostHog/Stripe/Gamma).
- **Spec §11.1 monorepo-pad** — werkelijkheid is flat repo; ik heb niet bekeken of er pre-monorepo-tooling (bv. `lerna`-config-rest) ergens slaapt.
